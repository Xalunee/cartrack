import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register Cyrillic fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Roboto-Medium.ttf', fontWeight: 'medium' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
  ],
})

interface CarHistoryPDFProps {
  car: {
    brand: string
    model: string
    year: number
    licensePlate: string | null
    currentMileage: number
  }
  maintenanceItems: Array<{
    name: string
    lastServiceDate: string | Date | null
    lastServiceMileage: number | null
    lastServiceCost: number | null
    intervalKm: number | null
  }>
  events: Array<{
    type: string
    title: string
    occurredAt: string | Date
    cost: number | null
  }>
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Roboto', fontSize: 10, color: '#1a1a1a' },
  header: { marginBottom: 24, borderBottom: '2 solid #1a1a1a', paddingBottom: 16 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logo: { fontSize: 16, fontWeight: 'bold' },
  genDate: { fontSize: 9, color: '#888' },
  carTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  carMeta: { fontSize: 11, color: '#666' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 10, color: '#1a1a1a' },
  table: { borderTop: '1 solid #e0e0e0' },
  row: { flexDirection: 'row', borderBottom: '1 solid #e0e0e0', paddingVertical: 6 },
  cellName: { flex: 3, fontSize: 10 },
  cellDate: { flex: 2, fontSize: 9, color: '#666' },
  cellMileage: { flex: 2, fontSize: 9, color: '#666' },
  cellCost: { flex: 1.5, fontSize: 10, textAlign: 'right' },
  summary: { marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4, flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 11, fontWeight: 'medium' },
  summaryValue: { fontSize: 14, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#aaa', borderTop: '1 solid #e0e0e0', paddingTop: 8 },
})

const eventTypeLabels: Record<string, string> = {
  ACCIDENT: 'Авария', MALFUNCTION: 'Неисправность', FINE: 'Штраф', SERVICE: 'СТО', NOTE: 'Заметка',
}

function fmtDate(d: string | Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function CarHistoryPDF({ car, maintenanceItems, events }: CarHistoryPDFProps) {
  const totalMaintenance = maintenanceItems.reduce((s, i) => s + (i.lastServiceCost ?? 0), 0)
  const totalEvents = events.reduce((s, e) => s + (e.cost ?? 0), 0)
  const total = totalMaintenance + totalEvents

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.logo}>CarTrack</Text>
            <Text style={styles.genDate}>Сформировано {fmtDate(new Date())}</Text>
          </View>
          <Text style={styles.carTitle}>{car.brand} {car.model}</Text>
          <Text style={styles.carMeta}>
            {car.year} год{car.licensePlate ? ` · ${car.licensePlate}` : ''} · Пробег: {car.currentMileage.toLocaleString('ru')} км
          </Text>
        </View>

        {/* Maintenance history */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>История обслуживания</Text>
          <View style={styles.table}>
            {maintenanceItems.map((item, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.cellName}>{item.name}</Text>
                <Text style={styles.cellDate}>{fmtDate(item.lastServiceDate)}</Text>
                <Text style={styles.cellMileage}>
                  {item.lastServiceMileage ? `${item.lastServiceMileage.toLocaleString('ru')} км` : '—'}
                </Text>
                <Text style={styles.cellCost}>
                  {item.lastServiceCost ? `${item.lastServiceCost.toLocaleString('ru')} ₽` : '—'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Events */}
        {events.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Журнал событий</Text>
            <View style={styles.table}>
              {events.map((e, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.cellName}>{e.title}</Text>
                  <Text style={styles.cellDate}>{eventTypeLabels[e.type] ?? e.type}</Text>
                  <Text style={styles.cellMileage}>{fmtDate(e.occurredAt)}</Text>
                  <Text style={styles.cellCost}>{e.cost ? `${e.cost.toLocaleString('ru')} ₽` : '—'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Всего вложено в обслуживание</Text>
          <Text style={styles.summaryValue}>{total.toLocaleString('ru')} ₽</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Сгенерировано в CarTrack — трекер обслуживания автомобиля
        </Text>
      </Page>
    </Document>
  )
}
