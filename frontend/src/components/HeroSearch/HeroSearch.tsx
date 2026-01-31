import { useId, useState } from "react";
import styles from "./HeroSearch.module.css";

export function HeroSearch() {
  const locationId = useId();
  const dateId = useId();
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className={styles.wrap}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          // Wire to search/navigation when ready
        }}
      >
        <div className={styles.inputWrap}>
          <label htmlFor={locationId} className="sr-only">
            Location
          </label>
          <input
            id={locationId}
            type="text"
            className={styles.input}
            placeholder="City or area"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            autoComplete="off"
            aria-label="Search by location"
          />
        </div>
        <div className={styles.inputWrap}>
          <label htmlFor={dateId} className="sr-only">
            Date
          </label>
          <input
            id={dateId}
            type="date"
            className={`${styles.input} ${styles.dateInput}`}
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Select date"
          />
        </div>
        <button type="submit" className={styles.cta}>
          BookMyTurf
        </button>
      </form>
    </div>
  );
}
