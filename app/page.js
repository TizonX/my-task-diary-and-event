import Link from 'next/link'

function Hero() {
  return (
    <section className="py-20">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">My Task Diary & Event</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">Telegram-first productivity: create tasks and events directly from Telegram and receive smart reminders powered by AI.</p>
        <div className="mt-8 flex justify-center gap-4">
          <a href="https://t.me/my_task_diary_and_event_bot" className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition">Open in Telegram</a>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const items = [
    'Todo Management', 'Event Management', 'Reminders', 'Priorities', 'Tags', 'AI Automation', 'Telegram Integration'
  ]
  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-800">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold mb-6">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((f) => (
            <div key={f} className="p-6 bg-white dark:bg-slate-900 rounded-lg shadow-sm hover:shadow-md transition">
              <h3 className="font-semibold mb-2">{f}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{f} powered for Telegram-first workflows.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    'User sends message to Telegram',
    'System processes task',
    'Reminders and notifications are delivered automatically'
  ]
  return (
    <section className="py-16">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold mb-6">How it works</h2>
        <ol className="space-y-4">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center">{i+1}</div>
              <div>{s}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function ExampleCommands() {
  const cmds = [
    '/add Buy milk by 6pm',
    '/event Meeting tomorrow 3pm',
    '/search milk',
    '/done 123',
    '/tag 123 work'
  ]
  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-800">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold mb-6">Example Commands</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cmds.map((c) => (
            <div key={c} className="p-4 bg-white dark:bg-slate-900 rounded-md">
              <code className="text-sm">{c}</code>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AISection() {
  return (
    <section className="py-16">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold mb-4">AI Integration</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl">Smart parsing, task suggestions, natural language understanding for commands and automated follow-ups.</p>
      </div>
    </section>
  )
}

function Privacy() {
  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-800">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold mb-4">Privacy & Security</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl">All data is stored in your configured PostgreSQL instance. Telegram tokens are stored encrypted in environment variables. We follow security best practices.</p>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <main>
      <div className="container mx-auto py-8">
        <Hero />
        <Features />
        <HowItWorks />
        <ExampleCommands />
        <AISection />
        <Privacy />

        <footer className="py-8 text-center text-sm text-slate-600 dark:text-slate-400">
          © {new Date().getFullYear()} My Task Diary & Event — Built for Telegram-first productivity.
        </footer>
      </div>
    </main>
  )
}
