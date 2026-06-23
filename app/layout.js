import './globals.css'

export const metadata = {
  title: 'My Task Diary & Event',
  description: 'Telegram-first personal productivity platform'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
