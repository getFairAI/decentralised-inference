from http.server import BaseHTTPRequestHandler, HTTPServer
from diffusers import StableDiffusionPipeline
import os
import json
import datetime
from PIL import Image
import torch

torch.backends.cuda.matmul.allow_tf32 = True

print("Loading Model\n")
pipe = StableDiffusionPipeline.from_ckpt(
  "./dreamshaper_631BakedVae-full.safetensors",
  local_files_only=True,
  torch_dtype=torch.float16,
  use_safetensors=True
)

pipe.to("cuda")
pipe.safety_checker = None
pipe.requires_safety_checker = False
print("Model Loaded for GPU")

curr_dir = os.getcwd()
def get_inputs(prompt = "", batch_size=1):      
  current_time = int(datetime.datetime.now().timestamp() * 1000)                                                                                                                                                                                                           
  generator = [torch.Generator("cuda").manual_seed(current_time + i) for i in range(batch_size)]                                                                                   
  prompts = batch_size * [prompt]                                                                                                                                                                                                             
  num_inference_steps = 50                                                                                                                                                                                                  

  return {"prompt": prompts, "generator": generator, "num_inference_steps": num_inference_steps}

def image_grid(imgs, rows=2, cols=2):                                                                                                                                                                                                         
    w, h = imgs[0].size                                                                                                                                                                                                                       
    grid = Image.new('RGB', size=(cols*w, rows*h))                                                                                                                                                                                            
                                                                                                                                                                                                                                              
    for i, img in enumerate(imgs):                                                                                                                                                                                                            
        grid.paste(img, box=(i%cols*w, i//cols*h))                                                                                                                                                                                            
    return grid  
  
def gen_img(prompt: str):
  images = pipe(**get_inputs(prompt,batch_size=4)).images
  current_time = datetime.datetime.now().timestamp()
  paths = []
  for i, img in enumerate(images):
    file_path = f"{curr_dir}/{prompt}-{i}-{current_time}.png"
    img.save(file_path, 'png')
    paths.append(file_path)

  return { "imgPaths": paths }

hostName = "localhost"
serverPort = 8088


class MyServer(BaseHTTPRequestHandler):
  def do_POST(self):
    if self.path == '/textToImage':
      content_length = int(self.headers['Content-Length']) # <--- Gets the size of data
      post_data = self.rfile.read(content_length) # <--- Gets the data itself
      prompt = post_data.decode("utf-8")
      result = gen_img(prompt)
      self.send_response(200)
      self.send_header("Content-Type", "application/json")
      self.end_headers()
      self.wfile.write(json.dumps(result).encode('utf-8'))
    else:
      self.send_error(404)

if __name__ == "__main__":
    webServer = HTTPServer((hostName, serverPort), MyServer)
    print("Server started http://%s:%s" % (hostName, serverPort))

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")