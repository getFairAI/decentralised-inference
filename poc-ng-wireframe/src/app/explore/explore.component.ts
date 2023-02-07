import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { InferenceDialogComponent } from '../inference-dialog/inference-dialog.component';

export interface Model {
  name: string;
  category: string;
  description: string;
  creator: string;
}
@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss']
})
export class ExploreComponent {
  nCols = 3;
  nModels: Model[] = [
    { name: '#1 bert', category: 'bert qa', description: '', creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M' },
    { name: '#2 bloom', category: 'bert qa', description: '', creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'  },
    { name: '#3 bert 500', category: 'bert qa', description: '', creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'  },
    { name: '#4 chatgpt', category: 'bert qa', description: '', creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'  },
    { name: '#5 yolo', category: 'bert qa', description: '', creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'  },
    { name: '#6 bert 1b', category: 'bert qa', description: '', creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'  },
    { name: '#7 bloom', category: 'bert qa', description: '', creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'  },
    { name: '#8', category: 'bert qa', description: '', creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'  },
    { name: '#9', category: 'bert qa', description: '', creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M' },
    { name: '#10', category: 'bert qa', description: '', creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'  },
    { name: '#11', category: 'bert qa', description: '', creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'  },
  ];

  constructor(private dialog: MatDialog, private router: Router, private route: ActivatedRoute) {}

  open() {
    /* this.router.navigate([ 'chat', 1]) */
    let dialogRef = this.dialog.open(InferenceDialogComponent, {
      height: '600px',
      width: '1000px',
    });

    dialogRef.afterClosed().subscribe((result: number) => {
      this.router.navigate(['chat', result] )
    });
  }
}
