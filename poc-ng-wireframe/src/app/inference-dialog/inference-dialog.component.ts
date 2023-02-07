import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SnackbarComponent } from '../snackbar/snackbar.component';

export interface Operator {
  name: string;
  address: string;
  rating: number;
  fee: number;
  id: number;
}

@Component({
  selector: 'app-inference-dialog',
  templateUrl: './inference-dialog.component.html',
  styleUrls: ['./inference-dialog.component.scss']
})
export class InferenceDialogComponent implements AfterViewInit {
  selectedElement!: Operator | null;
  operators: Operator[] = [
    { id: 1, name: 'op1', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 15, fee: 0.24 },
    { id: 2, name: 'op2', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 98, fee: 0.31 },
    { id: 3, name: 'op3', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 76, fee: 0.65 },
    { id: 4, name: 'op4', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 23, fee: 0.07 },
    { id: 5, name: 'op1', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 15, fee: 0.24 },
    { id: 6, name: 'op2', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 98, fee: 0.31 },
    { id: 7, name: 'op3', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 76, fee: 0.65 },
    { id: 8, name: 'op4', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 23, fee: 0.07 },
    { id: 9, name: 'op1', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 15, fee: 0.24 },
    { id: 10, name: 'op2', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 98, fee: 0.31 },
    { id: 11, name: 'op3', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 76, fee: 0.65 },
    { id: 12, name: 'op4', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 23, fee: 0.07 },
    { id: 13, name: 'op1', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 15, fee: 0.24 },
    { id: 14, name: 'op2', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 98, fee: 0.31 },
    { id: 15, name: 'op3', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 76, fee: 0.65 },
    { id: 16, name: 'op4', address: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M', rating: 23, fee: 0.07 },
  ];
  displayedColumns = ['name', 'address', 'rating', 'fee'];
  dataSource: MatTableDataSource<Operator>;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private snackbar: MatSnackBar) {
    this.dataSource = new MatTableDataSource(this.operators);
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  openSnack() {
    this.snackbar.openFromComponent(SnackbarComponent, {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }
}
