import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InferenceDialogComponent } from './inference-dialog.component';

describe('InferenceDialogComponent', () => {
  let component: InferenceDialogComponent;
  let fixture: ComponentFixture<InferenceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InferenceDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InferenceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
