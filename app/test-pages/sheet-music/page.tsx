import { SheetMusicDisplay } from '@/components/sheet-music-display'

// This is a sample MusicXML string for testing purposes.
const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>`

export default function SheetMusicTestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Sheet Music Display Test Page</h1>
      <SheetMusicDisplay musicXML={SAMPLE_XML} />
    </div>
  )
}
