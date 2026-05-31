import styles from './Slider.module.css';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit?: string;
}

export function Slider({ label, value, min, max, onChange, unit }: SliderProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}{unit ? ` ${unit}` : ''}</span>
      </div>
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      <div className={styles.ticks}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
