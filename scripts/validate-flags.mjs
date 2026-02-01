import fs from 'fs';
import { execSync } from 'child_process';

const LIB_PATH = 'lib/feature-flags.ts';
const CATALOG_PATH = 'FEATURE_CATALOG.md';
const ENV_EXAMPLE_PATH = '.env.example';

function log(message) {
  console.log(`[FF-CHECK] ${message}`);
}

function error(message) {
  console.error(`[FF-CHECK] ❌ ERROR: ${message}`);
}

function warn(message) {
  console.warn(`[FF-CHECK] ⚠️ WARN: ${message}`);
}

function validate() {
  log('Iniciando validación de feature flags...');
  let hasErrors = false;

  if (!fs.existsSync(LIB_PATH)) {
    error(`${LIB_PATH} no existe.`);
    return;
  }

  const libContent = fs.readFileSync(LIB_PATH, 'utf-8');

  // 1. Extraer flags de FEATURE_FLAGS_METADATA
  const metadataMatch = libContent.match(/export const FEATURE_FLAGS_METADATA = \{([\s\S]+?)\} as const satisfies/);
  if (!metadataMatch) {
    error('No se pudo encontrar FEATURE_FLAGS_METADATA en lib/feature-flags.ts');
    process.exit(1);
  }

  const flags = metadataMatch[1]
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.match(/^[A-Z0-9_]+: \{/))
    .map(line => line.split(':')[0].trim());

  log(`Detectados ${flags.length} flags en metadatos: ${flags.join(', ')}`);

  // 2. Verificar getClientValue
  const getClientValueMatch = libContent.match(/getClientValue\(flagName: string\): string \| undefined \{([\s\S]+?)default:/);
  const getClientValueContent = getClientValueMatch ? getClientValueMatch[1] : '';

  flags.forEach(flag => {
    if (!getClientValueContent.includes(`case '${flag}':`)) {
      error(`Flag "${flag}" falta en getClientValue (Necesario para soporte del lado del cliente).`);
      hasErrors = true;
    }
  });

  // 3. Verificar FEATURE_CATALOG.md
  if (fs.existsSync(CATALOG_PATH)) {
    const catalogContent = fs.readFileSync(CATALOG_PATH, 'utf-8');
    flags.forEach(flag => {
      if (!catalogContent.includes(flag)) {
        warn(`Flag "${flag}" no está documentada en ${CATALOG_PATH}`);
      }
    });
  }

  // 4. Verificar .env.example
  if (fs.existsSync(ENV_EXAMPLE_PATH)) {
    const envContent = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf-8');
    flags.forEach(flag => {
      if (!envContent.includes(flag)) {
        error(`Flag "${flag}" falta en ${ENV_EXAMPLE_PATH}`);
        hasErrors = true;
      }
      if (!envContent.includes(`NEXT_PUBLIC_${flag}`)) {
        error(`Prefijo NEXT_PUBLIC_ para "${flag}" falta en ${ENV_EXAMPLE_PATH}`);
        hasErrors = true;
      }
    });
  }

  // 5. Verificar uso en el código vs metadatos
  try {
    // Solo buscamos en archivos .ts, .tsx, .js, .jsx
    const usage = execSync("grep -rE 'FEATURE_[A-Z0-9_]+' . --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=reports --exclude=lib/feature-flags.ts --exclude=scripts/validate-flags.mjs", { encoding: 'utf-8' });

    const matches = usage.match(/FEATURE_[A-Z0-9_]+/g) || [];
    const usedFlags = [...new Set(matches)];

    usedFlags.forEach(flag => {
      if (flag === 'FEATURE_FLAGS_METADATA') return;

      if (!flags.includes(flag)) {
        const promoted = ['FEATURE_UI_VIOLIN_FINGERBOARD', 'FEATURE_TECHNICAL_FEEDBACK', 'FEATURE_ANALYTICS_DASHBOARD', 'FEATURE_PRACTICE_ASSISTANT'];
        if (!promoted.includes(flag)) {
            error(`Flag "${flag}" se usa en el código pero no está definida en FEATURE_FLAGS_METADATA.`);
            hasErrors = true;
        }
      }
    });
  } catch (e) {
    // Grep puede fallar si no hay resultados
  }

  if (hasErrors) {
    log('Validación fallida. Por favor, corrige los errores arriba.');
    process.exit(1);
  } else {
    log('✅ Validación completada con éxito.');
  }
}

validate();
