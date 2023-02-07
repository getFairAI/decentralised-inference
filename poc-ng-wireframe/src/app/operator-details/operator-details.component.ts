import { Component } from '@angular/core';
import { Operator } from '../inference-dialog/inference-dialog.component';

@Component({
  selector: 'app-operator-details',
  templateUrl: './operator-details.component.html',
  styleUrls: ['./operator-details.component.scss']
})
export class OperatorDetailsComponent {
  currentOperator: Operator = {
    id: 1,
    name: 'op1',
    address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M',
    rating: 15,
    fee: 0.24
  };
}
