import { Brand } from '../../shared/components/Brand';

/** Polityka prywatności (publiczna, bez logowania) — adres podany w App Store Connect. */
export function PrivacyPage() {
  return (
    <div className="page narrow privacy">
      <Brand />
      <h1 className="display">Polityka prywatności</h1>
      <p className="label">Obowiązuje od 13 października 2026</p>

      <p>
        Dobre Mleko to prywatna aplikacja do polecania miejsc w zamkniętej grupie przyjaciół (iOS i strona
        dobre-mleko.app). Tu opisujemy, jakie dane przetwarzamy, po co i jakie masz prawa.
      </p>

      <h2 className="title">Administrator danych</h2>
      <p>
        Administratorem danych jest twórca aplikacji Dobre Mleko. Kontakt w sprawach prywatności:{' '}
        <a href="mailto:kontakt@dobre-mleko.app">kontakt@dobre-mleko.app</a>.
      </p>

      <h2 className="title">Jakie dane przetwarzamy</h2>
      <ul>
        <li>
          <strong>Konto Google:</strong> adres e-mail, imię i zdjęcie profilowe — do logowania i sprawdzenia, czy jesteś
          na liście zaproszonych osób.
        </li>
        <li>
          <strong>Profil:</strong> wyświetlana nazwa, odznaka i ulubione kategorie — widzą je inni członkowie.
        </li>
        <li>
          <strong>Twoje treści:</strong> dodane miejsca, oceny, zdjęcia, komentarze, Złote Gwiazdki i zapisane miejsca —
          widzą je inni członkowie.
        </li>
        <li>
          <strong>Lokalizacja (opcjonalnie, za Twoją zgodą):</strong> przybliżona pozycja urządzenia, wysyłana z
          zapytaniami, żeby pokazać odległości do miejsc i mapę wokół Ciebie. Nie zapisujemy jej i nie pokazujemy innym.
        </li>
        <li>
          <strong>Powiadomienia (opcjonalnie, za Twoją zgodą):</strong> identyfikator urządzenia do powiadomień push i
          Twoje ustawienia powiadomień.
        </li>
        <li>
          <strong>Dane techniczne:</strong> logi serwera (np. adres IP, czas zapytania) potrzebne do działania i
          bezpieczeństwa usługi, przechowywane krótko.
        </li>
      </ul>

      <h2 className="title">Czego nie robimy</h2>
      <p>
        Nie wyświetlamy reklam, nie śledzimy Cię w innych aplikacjach ani na stronach, nie sprzedajemy i nie
        udostępniamy danych w celach marketingowych.
      </p>

      <h2 className="title">Komu przekazujemy dane</h2>
      <ul>
        <li>
          <strong>Google</strong> — logowanie kontem Google.
        </li>
        <li>
          <strong>Apple</strong> — dostarczanie powiadomień push (Apple Push Notification service).
        </li>
        <li>
          <strong>Dostawcy map</strong> (OpenFreeMap / OpenStreetMap) — pobieranie kafelków mapy; widzą adres IP
          urządzenia, nie Twoje dane konta.
        </li>
        <li>
          <strong>Hosting</strong> — serwer, na którym działa usługa i przechowywane są dane oraz zdjęcia.
        </li>
      </ul>

      <h2 className="title">Jak długo</h2>
      <p>
        Dane konta i treści przechowujemy, dopóki masz konto. Po usunięciu konta usuwamy dane osobowe; Twoje treści mogą
        zostać w aplikacji jako anonimowe („Były członek”), żeby nie psuć ocen i dyskusji innych osób.
      </p>

      <h2 className="title">Twoje prawa</h2>
      <p>
        Masz prawo do dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przeniesienia oraz
        sprzeciwu, a także do wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych. Kopię swoich danych
        wyeksportujesz w ustawieniach aplikacji; w pozostałych sprawach — w tym usunięcia konta — napisz na adres
        powyżej. Zgody na lokalizację i powiadomienia zmienisz w ustawieniach telefonu.
      </p>

      <h2 className="title">Dzieci</h2>
      <p>Dobre Mleko nie jest przeznaczone dla osób poniżej 13 lat.</p>

      <h2 className="title">Zmiany</h2>
      <p>O istotnych zmianach tej polityki poinformujemy w aplikacji.</p>
    </div>
  );
}
