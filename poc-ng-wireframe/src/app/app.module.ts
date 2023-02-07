import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import {MatToolbarModule} from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ModelsComponent } from './models/models.component';
import { AboutComponent } from './about/about.component';
import { ExploreComponent } from './explore/explore.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { InferenceDialogComponent } from './inference-dialog/inference-dialog.component';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { SnackbarComponent } from './snackbar/snackbar.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {MatSelectModule} from '@angular/material/select';
import { DndDirective } from './drag-upload.directive';
import { HistoryComponent } from './history/history.component';
import { OperatorDetailsComponent } from './operator-details/operator-details.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { ChatComponent } from './chat/chat.component';
import { OperatorsComponent } from './operators/operators.component';
@NgModule({
  declarations: [
    AppComponent,
    ModelsComponent,
    AboutComponent,
    ExploreComponent,
    InferenceDialogComponent,
    SnackbarComponent,
    DndDirective,
    HistoryComponent,
    OperatorDetailsComponent,
    ChatComponent,
    OperatorsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatGridListModule,
    MatInputModule,
    MatFormFieldModule,
    MatListModule,
    MatDialogModule,
    MatTableModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatMenuModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
