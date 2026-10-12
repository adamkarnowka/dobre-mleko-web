import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page narrow">
      <h1 className="display">Nie ma</h1>
      <p>Tej strony tu nie ma.</p>
      <Link className="btn btn-primary" to="/">
        Odkrywaj
      </Link>
    </div>
  );
}
