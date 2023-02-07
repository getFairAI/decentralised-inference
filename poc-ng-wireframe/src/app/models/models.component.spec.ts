import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelsComponent } from './models.component';

describe('ModelsComponent', () => {
  let component: ModelsComponent;
  let fixture: ComponentFixture<ModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModelsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
