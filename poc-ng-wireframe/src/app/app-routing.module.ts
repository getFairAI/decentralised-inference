import { AboutComponent } from './about/about.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ModelsComponent } from './models/models.component';
import { ExploreComponent } from './explore/explore.component';
import { OperatorDetailsComponent } from './operator-details/operator-details.component';
import { ChatComponent } from './chat/chat.component';
import { OperatorsComponent } from './operators/operators.component';

const routes: Routes = [
  {
    component: ModelsComponent,
    path: 'models'
  },
  {
    path: '',
    component: AboutComponent,
  },
  {
    path: 'explore',
    component: ExploreComponent,
  },
  {
    path: 'chat/:id',
    component: ChatComponent,
  },
  {
    path: 'operators',
    component: OperatorsComponent
  },
  {
    path: '**',
    redirectTo: '/'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
