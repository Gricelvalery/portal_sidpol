import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Submodulos } from './submodulos';

describe('Submodulos', () => {
  let component: Submodulos;
  let fixture: ComponentFixture<Submodulos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Submodulos],
    }).compileComponents();

    fixture = TestBed.createComponent(Submodulos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
