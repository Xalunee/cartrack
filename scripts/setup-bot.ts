const token = process.env.TELEGRAM_BOT_TOKEN

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN not set')
  process.exit(1)
}

const API = `https://api.telegram.org/bot${token}`

async function setup() {
  // Set commands
  const commands = [
    { command: 'start', description: '🚗 Главное меню' },
    { command: 'link', description: '🔗 Привязать аккаунт (6-значный код)' },
  ]

  const cmdRes = await fetch(`${API}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands }),
  })
  console.log('Commands:', (await cmdRes.json()).ok ? '✓' : '✗')

  // Set description (shown before /start)
  const descRes = await fetch(`${API}/setMyDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'CarTrack — трекер обслуживания автомобиля. Напоминания о пробеге, статус обслуживания, учёт расходов.',
    }),
  })
  console.log('Description:', (await descRes.json()).ok ? '✓' : '✗')

  // Set short description (shown in chat list)
  const shortRes = await fetch(`${API}/setMyShortDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      short_description: 'Трекер обслуживания авто',
    }),
  })
  console.log('Short desc:', (await shortRes.json()).ok ? '✓' : '✗')

  console.log('\n✓ Bot setup complete')
  console.log('\nTo set avatar: open @BotFather, send /setuserpic, choose your bot, upload image.')
}

setup()
