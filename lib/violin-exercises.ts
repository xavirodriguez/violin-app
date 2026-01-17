/**
 * Exercise definitions for violin practice
 */

interface Note {
  pitch: string
  duration: string
  measure: number
}

export interface Exercise {
  id: string
  name: string
  notes: Note[]
  musicXML: string
}

export const violinExercises: Exercise[] = [
  {
    id: 'open-g-string',
    name: 'Open G String',
    notes: [
      { pitch: 'G3', duration: 'quarter', measure: 1 },
      { pitch: 'G3', duration: 'quarter', measure: 1 },
      { pitch: 'G3', duration: 'quarter', measure: 1 },
      { pitch: 'G3', duration: 'quarter', measure: 1 },
    ],
    musicXML: `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>G</step><octave>3</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>G</step><octave>3</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>G</step><octave>3</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>G</step><octave>3</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`,
  },
  {
    id: 'open-d-string',
    name: 'Open D String',
    notes: [
      { pitch: 'D4', duration: 'quarter', measure: 1 },
      { pitch: 'D4', duration: 'quarter', measure: 1 },
      { pitch: 'D4', duration: 'quarter', measure: 1 },
      { pitch: 'D4', duration: 'quarter', measure: 1 },
    ],
    musicXML: `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`,
  },
  {
    id: 'open-a-string',
    name: 'Open A String',
    notes: [
      { pitch: 'A4', duration: 'quarter', measure: 1 },
      { pitch: 'A4', duration: 'quarter', measure: 1 },
      { pitch: 'A4', duration: 'quarter', measure: 1 },
      { pitch: 'A4', duration: 'quarter', measure: 1 },
    ],
    musicXML: `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`,
  },
  {
    id: 'open-e-string',
    name: 'Open E String',
    notes: [
      { pitch: 'E5', duration: 'quarter', measure: 1 },
      { pitch: 'E5', duration: 'quarter', measure: 1 },
      { pitch: 'E5', duration: 'quarter', measure: 1 },
      { pitch: 'E5', duration: 'quarter', measure: 1 },
    ],
    musicXML: `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`,
  },
  {
    id: 'g-major-scale-first-4',
    name: 'G Major Scale (First 4 Notes)',
    notes: [
      { pitch: 'G4', duration: 'quarter', measure: 1 },
      { pitch: 'A4', duration: 'quarter', measure: 1 },
      { pitch: 'B4', duration: 'quarter', measure: 1 },
      { pitch: 'C5', duration: 'quarter', measure: 1 },
    ],
    musicXML: `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>1</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`,
  },
  {
    id: 'twinkle-twinkle-first-phrase',
    name: 'Twinkle Twinkle Little Star (First Phrase)',
    notes: [
      { pitch: 'G3', duration: 'quarter', measure: 1 },
      { pitch: 'G3', duration: 'quarter', measure: 1 },
      { pitch: 'D4', duration: 'quarter', measure: 1 },
      { pitch: 'D4', duration: 'quarter', measure: 1 },
    ],
    musicXML: `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>G</step><octave>3</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>G</step><octave>3</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`,
  },
  {
    id: 'd-major-scale-first-4',
    name: 'D Major Scale (First 4 notes)',
    notes: [
      { pitch: 'D4', duration: 'quarter', measure: 1 },
      { pitch: 'E4', duration: 'quarter', measure: 1 },
      { pitch: 'F#4', duration: 'quarter', measure: 1 },
      { pitch: 'G4', duration: 'quarter', measure: 1 },
    ],
    musicXML: `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>2</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>F</step><alter>1</alter><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`,
  },
  {
    id: 'bile-em-cabbage-down-first-phrase',
    name: 'Bile Em Cabbage Down (First Phrase)',
    notes: [
      { pitch: 'A4', duration: 'quarter', measure: 1 },
      { pitch: 'A4', duration: 'quarter', measure: 1 },
      { pitch: 'G4', duration: 'quarter', measure: 1 },
      { pitch: 'F#4', duration: 'quarter', measure: 1 },
    ],
    musicXML: `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>1</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>F</step><alter>1</alter><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`,
  },
  {
    id: 'a-major-scale-first-4',
    name: 'A Major Scale (First 4 notes)',
    notes: [
      { pitch: 'A4', duration: 'quarter', measure: 1 },
      { pitch: 'B4', duration: 'quarter', measure: 1 },
      { pitch: 'C#5', duration: 'quarter', measure: 1 },
      { pitch: 'D5', duration: 'quarter', measure: 1 },
    ],
    musicXML: `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>3</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>C</step><alter>1</alter><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`,
  },
  {
    id: 'ode-to-joy-first-phrase',
    name: 'Ode to Joy (First Phrase)',
    notes: [
      { pitch: 'B4', duration: 'quarter', measure: 1 },
      { pitch: 'B4', duration: 'quarter', measure: 1 },
      { pitch: 'C5', duration: 'quarter', measure: 1 },
      { pitch: 'D5', duration: 'quarter', measure: 1 },
    ],
    musicXML: `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>1</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`,
  },
]
