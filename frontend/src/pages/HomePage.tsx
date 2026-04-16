import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <section className='page'>
      <h1>Magazin Online MVP</h1>
      <p className='lead'>
        Implementare initiala pentru proiectul TAP: catalog produse,
        autentificare si flux extins in etapele urmatoare.
      </p>
      <div className='actions'>
        <Link className='button' to='/products'>
          Vezi Produse
        </Link>
        <Link className='button button-secondary' to='/login'>
          Login
        </Link>
      </div>
    </section>
  );
}
