export default function PageHeader({ title, subtitle }) {
  return (
    <header className="page-header">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </header>
  );
}
