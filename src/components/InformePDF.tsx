import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

export type LaborInforme = {
  fecha: string
  tipo: string
  responsable: string
  comprobante: string
  productos: string
  estadoFeno: string
  observaciones: string
  recomendaciones: string
}
export type InformeData = {
  asesor: string
  productor: string
  campo: string
  campania: string
  cultivo: string
  superficie: string
  emitido: string
  labores: LaborInforme[]
}

const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 48, paddingHorizontal: 40, fontSize: 10, color: '#2B2B29', fontFamily: 'Helvetica' },
  header: { borderBottomWidth: 2, borderBottomColor: '#1A5C2A', paddingBottom: 10, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  brand: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#1A5C2A' },
  sub: { fontSize: 9, color: '#5F5E5A', marginTop: 2 },
  emit: { fontSize: 9, color: '#5F5E5A', textAlign: 'right' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  infoCell: { width: '33%', marginBottom: 8 },
  infoLabel: { fontSize: 8, color: '#8A8A85' },
  infoValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#2B2B29' },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1A5C2A', marginBottom: 8 },
  labor: { borderWidth: 0.5, borderColor: '#E0DDD2', borderRadius: 4, padding: 8, marginBottom: 6 },
  laborTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  laborFecha: { fontSize: 9, color: '#5F5E5A' },
  laborTipo: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1A5C2A' },
  field: { marginTop: 3 },
  fieldLabel: { fontSize: 8, color: '#8A8A85' },
  fieldText: { fontSize: 9 },
  rec: { fontSize: 9, color: '#185FA5' },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#8A8A85', borderTopWidth: 0.5, borderTopColor: '#E0DDD2', paddingTop: 6 },
})

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

function InformeDoc({ data }: { data: InformeData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Cuaderno de campo</Text>
            <Text style={styles.sub}>Informe de manejo técnico</Text>
          </View>
          <Text style={styles.emit}>Emitido: {data.emitido}</Text>
        </View>

        <View style={styles.infoGrid}>
          <InfoCell label="Productor" value={data.productor} />
          <InfoCell label="Campo" value={data.campo} />
          <InfoCell label="Campaña" value={data.campania} />
          <InfoCell label="Cultivo" value={data.cultivo} />
          <InfoCell label="Superficie" value={data.superficie} />
          <InfoCell label="Asesor" value={data.asesor} />
        </View>

        <Text style={styles.sectionTitle}>Bitácora de labores ({data.labores.length})</Text>

        {data.labores.map((l, i) => (
          <View key={i} style={styles.labor} wrap={false}>
            <View style={styles.laborTop}>
              <Text style={styles.laborTipo}>{l.tipo}</Text>
              <Text style={styles.laborFecha}>{l.fecha}{l.comprobante ? `  ·  Comp. ${l.comprobante}` : ''}</Text>
            </View>
            {l.productos ? (<View style={styles.field}><Text style={styles.fieldLabel}>Productos</Text><Text style={styles.fieldText}>{l.productos}</Text></View>) : null}
            {l.estadoFeno ? (<View style={styles.field}><Text style={styles.fieldLabel}>Estado fenológico</Text><Text style={styles.fieldText}>{l.estadoFeno}</Text></View>) : null}
            {l.observaciones ? (<View style={styles.field}><Text style={styles.fieldLabel}>Observaciones</Text><Text style={styles.fieldText}>{l.observaciones}</Text></View>) : null}
            {l.recomendaciones ? (<View style={styles.field}><Text style={styles.fieldLabel}>Recomendaciones</Text><Text style={styles.rec}>{l.recomendaciones}</Text></View>) : null}
            {l.responsable ? (<View style={styles.field}><Text style={styles.fieldLabel}>Responsable</Text><Text style={styles.fieldText}>{l.responsable}</Text></View>) : null}
          </View>
        ))}

        {data.labores.length === 0 ? <Text style={styles.fieldText}>Sin labores registradas en esta campaña.</Text> : null}

        <View style={styles.footer} fixed>
          <Text>{data.productor} · {data.campo} · {data.campania}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export async function descargarInforme(data: InformeData) {
  const blob = await pdf(<InformeDoc data={data} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `informe_${data.productor}_${data.campania}`.replace(/[^a-zA-Z0-9_-]+/g, '_') + '.pdf'
  a.click()
  URL.revokeObjectURL(url)
}
