export default function LanguageToggle({ language, onToggle }) {
  return (
    <button className="chip-toggle" onClick={onToggle} type="button" aria-label="Toggle language">
      <span className={language === 'en' ? 'chip active' : 'chip'}>EN</span>
      <span className={language === 'ta' ? 'chip active' : 'chip'}>தமிழ்</span>
    </button>
  )
}
