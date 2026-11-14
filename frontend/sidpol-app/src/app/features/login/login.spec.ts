import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Login } from './login';
import { NotificacionService } from '../../core/notificaciones/notificacion.service';
import { API, proveedoresHttp, usuarioDePrueba } from '../../testing/helpers';

describe('Login', () => {
  let backend: HttpTestingController;
  let router: Router;

  const montar = async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [Login], providers: proveedoresHttp() });
    backend = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    return fixture;
  };

  const ingresar = async (fixture: Awaited<ReturnType<typeof montar>>, usuario: string, clave: string) => {
    fixture.componentInstance.username = usuario;
    fixture.componentInstance.contrasenia = clave;
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.btn-ingresar')!.click();
    await fixture.whenStable();
  };

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('campos vacíos → mensajes de validación, sin llamar a la API', async () => {
    const fixture = await montar();
    await ingresar(fixture, '', '');
    const errores = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.campo-error')].map((p) => p.textContent?.trim());
    expect(errores).toEqual(['El usuario es obligatorio', 'La contraseña es obligatoria']);
    backend.expectNone(`${API}/auth/login`);
  });

  it.each([
    [401, 'Usuario o contraseña incorrectos.'],
    [403, 'Usuario no autorizado. Contacte al administrador.'],
    [429, 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'],
    [0, 'Error de conexión. Intente nuevamente.']
  ])('error %i → mensaje en el formulario (no toast)', async (status, mensaje) => {
    const fixture = await montar();
    await ingresar(fixture, 'gricel.mucha', 'mala');
    backend.expectOne(`${API}/auth/login`).flush({}, { status, statusText: 'x' });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('.error-msg')?.textContent).toContain(mensaje);
    expect(TestBed.inject(NotificacionService).lista()).toEqual([]);
  });

  it('el mensaje de error se oculta a los 10 segundos', async () => {
    const fixture = await montar();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    // Sin whenStable() mientras los temporizadores son falsos (esperaría para siempre)
    fixture.componentInstance.username = 'gricel.mucha';
    fixture.componentInstance.contrasenia = 'mala';
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.btn-ingresar')!.click();
    backend.expectOne(`${API}/auth/login`).flush({}, { status: 401, statusText: 'x' });
    expect(fixture.componentInstance['errorMsg']()).toBe('Usuario o contraseña incorrectos.');

    vi.advanceTimersByTime(9999);
    expect(fixture.componentInstance['errorMsg']()).not.toBe('');
    vi.advanceTimersByTime(1);
    vi.useRealTimers();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('.error-msg')).toBeNull();
  });

  it('login correcto → guarda la sesión y va a /inicio', async () => {
    const fixture = await montar();
    await ingresar(fixture, 'gricel.mucha', 'Secreta123');
    backend.expectOne(`${API}/auth/login`).flush({ success: true, token: 'jwt', usuario: usuarioDePrueba() });
    expect(localStorage.getItem('token')).toBe('jwt');
    expect(router.navigate).toHaveBeenCalledWith(['/inicio']);
  });
});
