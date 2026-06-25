export default function Footer() {
  return (
    <footer className="py-5">
      <p className="text-center text-text-tertiary" style={{ fontSize: "var(--text-xs)" }}>
        DVAP v1.1.0{" "}
        <span aria-hidden="true">&middot;</span>{" "}
        <a
          href="https://github.com/beproy/dvap"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text-secondary transition-colors"
        >
          github.com/beproy/dvap
        </a>
      </p>
    </footer>
  )
}
