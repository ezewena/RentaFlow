export type TipoServicio = 'electricidad' | 'gas' | 'agua' | 'impuesto'

export interface ServicioConfigProvincia {
  key: string
  label: string
  campo: string
  tipo: TipoServicio
}

/** URL del portal de consulta/pago de cada proveedor */
export const URL_SERVICIO: Record<string, string> = {
  // Electricidad
  edesur:       'https://www.edesur.com.ar/consulta-de-deuda/',
  edenor:       'https://www.edenor.com/',
  epec:         'https://www.epec.com.ar/',
  epe:          'https://www.epe.santafe.gov.ar/',
  edemsa:       'https://oficinavirtual.edemsa.com/login.php?destino=oficina',
  edesj:        'https://www.edesj.com.ar/',
  edesal:       'https://www.edesal.com.ar/',
  edet:         'https://www.edet.com.ar/',
  edesa:        'https://www.edesa.com.ar/',
  ejesa:        'https://www.ejesa.com.ar/',
  edecat:       'https://www.edecat.com.ar/',
  edelar:       'https://www.edelar.com.ar/',
  edese:        'https://www.edese.com.ar/',
  epen:         'https://www.epen.com.ar/',
  edersa:       'https://www.edersa.com.ar/',
  dpec_chubut:  'https://www.dpec.com.ar/',
  spse:         'https://www.spse.com.ar/',
  seet:         'https://www.dgr.tierradelfuego.gov.ar/',
  dpec_pampa:   'https://www.dpam.gov.ar/',
  enersa:       'https://www.enersa.com.ar/',
  dpec:         'https://www.dpec.com.ar/',
  emsa:         'https://www.emsa.com.ar/',
  secheep:      'https://www.secheep.com.ar/',
  foresa:       'https://www.foresa.com.ar/',
  eden:         'https://www.eden.com.ar/',
  // Gas
  metrogas:     'https://www.metrogas.com.ar/',
  naturgy:      'https://www.naturgy.com.ar/',
  ecogas_mza:   'https://autogestion.ecogas.com.ar/uiextranet/ingreso?s=p',
  ecogas:       'https://autogestion.ecogas.com.ar/uiextranet/ingreso?s=p',
  camuzzi:      'https://www.camuzzi.com.ar/',
  camuzzi_sur:  'https://www.camuzzi.com.ar/',
  // Agua
  aysa:         'https://www.aysa.com.ar/',
  aysam:        'https://oficinavirtual.aysam.com.ar/section/home-public/detail-cuenta/',
  aguascordobesas: 'https://www.aguascordobesas.com.ar/',
  assa:         'https://www.assa.santafe.gov.ar/',
  // Impuesto municipal Mendoza (por departamento — clave: imp_mza_{depto})
  imp_mza_capital:      'https://apex.ciudaddemendoza.gov.ar/apex/produccion/f?p=204:5002:11454809950276:::::',
  imp_mza_godoy_cruz:   'https://www.godoycruz.gob.ar/servicios-online/',
  imp_mza_guaymallen:   'https://www.guaymallen.gob.ar/servicios/',
  imp_mza_las_heras:    'https://www.lasheras.gob.ar/servicios/',
  imp_mza_lujan:        'https://www.lujan.gob.ar/servicios/',
  imp_mza_maipu:        'https://www.maipo.gov.ar/servicios/',
  imp_mza_san_rafael:   'https://www.sanrafael.gov.ar/servicios/',
  imp_mza_malargue:     'https://www.malargue.gov.ar/servicios/',
  imp_mza_san_martin:   'https://www.sanmartin.gob.ar/servicios/',
  imp_mza_rivadavia:    'https://www.rivadavia.gob.ar/servicios/',
  imp_mza_junin:        'https://www.junin.gob.ar/servicios/',
  imp_mza_lavalle:      'https://lavalle.gob.ar/servicios/',
  imp_mza_san_carlos:   'https://www.sancarlos.gob.ar/servicios/',
  imp_mza_tunuyan:      'https://www.tunuyan.gob.ar/servicios/',
  imp_mza_tupungato:    'https://www.tupungato.gob.ar/servicios/',
  imp_mza_gral_alvear:  'https://generalalvear.gob.ar/servicios/',
  imp_mza_la_paz:       'https://www.lapaz.mendoza.gov.ar/servicios/',
  imp_mza_santa_rosa:   'https://www.santarosamendoza.gob.ar/servicios/',
  // Impuestos
  abl_agip:     'https://www.agip.gob.ar/',
  arba:         'https://www.arba.gov.ar/',
  rentas_cba:   'https://www.rentascordoba.gob.ar/',
  api_sf:       'https://www.santafe.gov.ar/',
  dgr_mza:      'https://www.mendoza.gov.ar/dgr/',
  dgr_sj:       'https://www.sanjuan.gov.ar/impuestos',
  dgr_sl:       'https://www.hacienda.sanluis.gov.ar/',
  dgr_tuc:      'https://www.aterweb.com.ar/',
  dgr_sal:      'https://www.rentas.salta.gov.ar/',
  dgr_juj:      'https://www.rentasjujuy.gob.ar/',
  dgr_cat:      'https://www.rentas.catamarca.gov.ar/',
  dgr_lr:       'https://www.dgrentas.larioja.gov.ar/',
  dgr_sde:      'https://www.dgr.gob.ar/',
  dgr_nqn:      'https://www.dgrneuquen.gob.ar/',
  dgr_rn:       'https://www.ati.rionegro.gov.ar/',
  dgr_chb:      'https://www.dgr.chubut.gov.ar/',
  dgr_sc:       'https://www.dgr.santacruz.gov.ar/',
  dgr_tdf:      'https://www.dgr.tierradelfuego.gov.ar/',
  dgr_lp:       'https://www.lapampa.gob.ar/dgr',
  dgr_er:       'https://www.dgrentrerios.gob.ar/',
  dgr_ctes:     'https://www.dgrcorrientes.gov.ar/',
  dgr_mis:      'https://www.dgrmisiones.gov.ar/',
  dgr_cha:      'https://www.chaco.gov.ar/',
  dgr_for:      'https://www.hacienda.formosa.gov.ar/',
}

/** Departamentos de Mendoza con sus claves de impuesto */
export const DEPARTAMENTOS_MENDOZA: { label: string; key: string }[] = [
  { label: 'Capital (Ciudad de Mendoza)', key: 'imp_mza_capital' },
  { label: 'Godoy Cruz',                  key: 'imp_mza_godoy_cruz' },
  { label: 'Guaymallén',                  key: 'imp_mza_guaymallen' },
  { label: 'Las Heras',                   key: 'imp_mza_las_heras' },
  { label: 'Luján de Cuyo',              key: 'imp_mza_lujan' },
  { label: 'Maipú',                       key: 'imp_mza_maipu' },
  { label: 'San Rafael',                  key: 'imp_mza_san_rafael' },
  { label: 'Malargüe',                    key: 'imp_mza_malargue' },
  { label: 'San Martín',                  key: 'imp_mza_san_martin' },
  { label: 'Rivadavia',                   key: 'imp_mza_rivadavia' },
  { label: 'Junín',                       key: 'imp_mza_junin' },
  { label: 'Lavalle',                     key: 'imp_mza_lavalle' },
  { label: 'San Carlos',                  key: 'imp_mza_san_carlos' },
  { label: 'Tunuyán',                     key: 'imp_mza_tunuyan' },
  { label: 'Tupungato',                   key: 'imp_mza_tupungato' },
  { label: 'General Alvear',              key: 'imp_mza_gral_alvear' },
  { label: 'La Paz',                      key: 'imp_mza_la_paz' },
  { label: 'Santa Rosa',                  key: 'imp_mza_santa_rosa' },
]

export const PROVINCIAS_ARGENTINA: string[] = [
  'CABA',
  'Buenos Aires (GBA Sur — EDESUR)',
  'Buenos Aires (GBA Norte — EDENOR)',
  'Buenos Aires (Provincia interior)',
  'Córdoba',
  'Santa Fe',
  'Mendoza',
  'Tucumán',
  'Salta',
  'Jujuy',
  'Entre Ríos',
  'Corrientes',
  'Misiones',
  'Chaco',
  'Formosa',
  'Santiago del Estero',
  'San Juan',
  'San Luis',
  'La Rioja',
  'Catamarca',
  'Neuquén',
  'Río Negro',
  'Chubut',
  'Santa Cruz',
  'Tierra del Fuego',
  'La Pampa',
]

export const SERVICIOS_POR_PROVINCIA: Record<string, ServicioConfigProvincia[]> = {
  'CABA': [
    { key: 'edesur',   label: 'EDESUR',          campo: 'NIC',              tipo: 'electricidad' },
    { key: 'metrogas', label: 'Metrogas',         campo: 'Nro. de Cliente',  tipo: 'gas' },
    { key: 'aysa',     label: 'AySA',             campo: 'Nro. de Cliente',  tipo: 'agua' },
    { key: 'abl_agip', label: 'ABL — AGIP',       campo: 'Partida',          tipo: 'impuesto' },
  ],
  'Buenos Aires (GBA Sur — EDESUR)': [
    { key: 'edesur',   label: 'EDESUR',           campo: 'NIC',              tipo: 'electricidad' },
    { key: 'metrogas', label: 'Metrogas',          campo: 'Nro. de Cliente',  tipo: 'gas' },
    { key: 'aysa',     label: 'AySA',              campo: 'Nro. de Cliente',  tipo: 'agua' },
    { key: 'arba',     label: 'Inmobiliario — ARBA', campo: 'Partida',        tipo: 'impuesto' },
  ],
  'Buenos Aires (GBA Norte — EDENOR)': [
    { key: 'edenor',   label: 'EDENOR',           campo: 'NIC',              tipo: 'electricidad' },
    { key: 'metrogas', label: 'Metrogas',          campo: 'Nro. de Cliente',  tipo: 'gas' },
    { key: 'aysa',     label: 'AySA',              campo: 'Nro. de Cliente',  tipo: 'agua' },
    { key: 'arba',     label: 'Inmobiliario — ARBA', campo: 'Partida',        tipo: 'impuesto' },
  ],
  'Buenos Aires (Provincia interior)': [
    { key: 'eden',     label: 'EDEN',                    campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'camuzzi',  label: 'Camuzzi Gas Pampeana',    campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'arba',     label: 'Inmobiliario — ARBA',     campo: 'Partida',         tipo: 'impuesto' },
  ],
  'Córdoba': [
    { key: 'epec',            label: 'EPEC',                        campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'naturgy',         label: 'Naturgy (Litoral Gas)',        campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'aguascordobesas', label: 'Aguas Cordobesas',             campo: 'Nro. de Cuenta',  tipo: 'agua' },
    { key: 'rentas_cba',      label: 'Contribución Inmobiliaria — Rentas Cba', campo: 'Nro. de Cuenta', tipo: 'impuesto' },
  ],
  'Santa Fe': [
    { key: 'epe',       label: 'EPE',                    campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'naturgy',   label: 'Naturgy (Litoral Gas)',   campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'assa',      label: 'ASSA',                    campo: 'Nro. de Cliente', tipo: 'agua' },
    { key: 'api_sf',    label: 'Inmobiliario — API Santa Fe', campo: 'Partida',     tipo: 'impuesto' },
  ],
  'Mendoza': [
    { key: 'edemsa',      label: 'EDEMSA',                     campo: 'NIS',             tipo: 'electricidad' },
    { key: 'ecogas_mza',  label: 'ECOGAS',                     campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'aysam',       label: 'AYSAM',                      campo: 'Nro. de Cuenta',  tipo: 'agua' },
    // El impuesto se asigna dinámicamente por departamento — ver getMendozaImpuestoConfig()
    { key: 'imp_mza_capital', label: 'Impuesto Municipal',     campo: 'Nro. de Cuenta',  tipo: 'impuesto' },
  ],
  'San Juan': [
    { key: 'edesj',     label: 'EDESJ',                    campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'naturgy',   label: 'Naturgy (Gas Cuyana)',      campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_sj',    label: 'Inmobiliario — DGR San Juan', campo: 'Partida',       tipo: 'impuesto' },
  ],
  'San Luis': [
    { key: 'edesal',    label: 'EDESAL',                   campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'naturgy',   label: 'Naturgy (Gas Cuyana)',      campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_sl',    label: 'Inmobiliario — DGR San Luis', campo: 'Partida',       tipo: 'impuesto' },
  ],
  'Tucumán': [
    { key: 'edet',      label: 'EDET',                     campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'ecogas',    label: 'Ecogas (Gasnor)',           campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_tuc',   label: 'Inmobiliario — DGR Tucumán', campo: 'Partida',        tipo: 'impuesto' },
  ],
  'Salta': [
    { key: 'edesa',     label: 'EDESA',                    campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'ecogas',    label: 'Ecogas (Gasnor)',           campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_sal',   label: 'Inmobiliario — DGR Salta',  campo: 'Partida',         tipo: 'impuesto' },
  ],
  'Jujuy': [
    { key: 'ejesa',     label: 'EJESA',                    campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'ecogas',    label: 'Ecogas (Gasnor)',           campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_juj',   label: 'Inmobiliario — DGR Jujuy',  campo: 'Partida',         tipo: 'impuesto' },
  ],
  'Catamarca': [
    { key: 'edecat',    label: 'EDECAT',                   campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'ecogas',    label: 'Ecogas',                   campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_cat',   label: 'Inmobiliario — DGR Catamarca', campo: 'Partida',      tipo: 'impuesto' },
  ],
  'La Rioja': [
    { key: 'edelar',    label: 'EDELAR',                   campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'ecogas',    label: 'Ecogas',                   campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_lr',    label: 'Inmobiliario — DGR La Rioja', campo: 'Partida',       tipo: 'impuesto' },
  ],
  'Santiago del Estero': [
    { key: 'edese',     label: 'EDESE',                    campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'ecogas',    label: 'Ecogas',                   campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_sde',   label: 'Inmobiliario — DGR Stgo. del Estero', campo: 'Partida', tipo: 'impuesto' },
  ],
  'Neuquén': [
    { key: 'epen',        label: 'EPEN',                   campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'camuzzi_sur', label: 'Camuzzi Gas del Sur',    campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_nqn',     label: 'Inmobiliario — DGR Neuquén', campo: 'Partida',     tipo: 'impuesto' },
  ],
  'Río Negro': [
    { key: 'edersa',      label: 'EDERSA',                 campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'camuzzi_sur', label: 'Camuzzi Gas del Sur',    campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_rn',      label: 'Inmobiliario — ATI Río Negro', campo: 'Partida',   tipo: 'impuesto' },
  ],
  'Chubut': [
    { key: 'dpec_chubut', label: 'DPEC Chubut',            campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'camuzzi_sur', label: 'Camuzzi Gas del Sur',    campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_chb',     label: 'Inmobiliario — DGR Chubut', campo: 'Partida',      tipo: 'impuesto' },
  ],
  'Santa Cruz': [
    { key: 'spse',        label: 'SPSE',                   campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'camuzzi_sur', label: 'Camuzzi Gas del Sur',    campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_sc',      label: 'Inmobiliario — DGR Santa Cruz', campo: 'Partida',  tipo: 'impuesto' },
  ],
  'Tierra del Fuego': [
    { key: 'seet',        label: 'SEET',                   campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'camuzzi_sur', label: 'Camuzzi Gas del Sur',    campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_tdf',     label: 'Inmobiliario — DGR Tierra del Fuego', campo: 'Partida', tipo: 'impuesto' },
  ],
  'La Pampa': [
    { key: 'dpec_pampa',  label: 'DPEC La Pampa',          campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'camuzzi',     label: 'Camuzzi Gas Pampeana',   campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_lp',      label: 'Inmobiliario — DGR La Pampa', campo: 'Partida',    tipo: 'impuesto' },
  ],
  'Entre Ríos': [
    { key: 'enersa',    label: 'ENERSA',                   campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'naturgy',   label: 'Naturgy (Litoral Gas)',    campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_er',    label: 'Inmobiliario — DGR Entre Ríos', campo: 'Partida',    tipo: 'impuesto' },
  ],
  'Corrientes': [
    { key: 'dpec',      label: 'DPEC',                     campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'naturgy',   label: 'Naturgy (Litoral Gas)',    campo: 'Nro. de Cliente', tipo: 'gas' },
    { key: 'dgr_ctes',  label: 'Inmobiliario — DGR Corrientes', campo: 'Partida',   tipo: 'impuesto' },
  ],
  'Misiones': [
    { key: 'emsa',      label: 'EMSA',                     campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'dgr_mis',   label: 'Inmobiliario — DGR Misiones', campo: 'Partida',      tipo: 'impuesto' },
  ],
  'Chaco': [
    { key: 'secheep',   label: 'SECHEEP',                  campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'dgr_cha',   label: 'Inmobiliario — DGR Chaco',  campo: 'Partida',         tipo: 'impuesto' },
  ],
  'Formosa': [
    { key: 'foresa',    label: 'FORESA',                   campo: 'Nro. de Cliente', tipo: 'electricidad' },
    { key: 'dgr_for',   label: 'Inmobiliario — DGR Formosa', campo: 'Partida',        tipo: 'impuesto' },
  ],
}

/** Intenta detectar la provincia a partir de la dirección ingresada. */
export function detectarProvincia(direccion: string): string | null {
  // Normalize: minúsculas + sin tildes
  const d = direccion
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

  // Ciudades/departamentos que determinan la provincia sin ambigüedad
  const ciudades: [string, string][] = [
    // Mendoza
    ['godoy cruz', 'Mendoza'],
    ['las heras', 'Mendoza'],
    ['lujan de cuyo', 'Mendoza'],
    ['maipu', 'Mendoza'],
    ['guaymallen', 'Mendoza'],
    ['san martin, mendoza', 'Mendoza'],
    ['rivadavia, mendoza', 'Mendoza'],
    // GBA Sur (EDESUR)
    ['quilmes', 'Buenos Aires (GBA Sur — EDESUR)'],
    ['lanus', 'Buenos Aires (GBA Sur — EDESUR)'],
    ['lomas de zamora', 'Buenos Aires (GBA Sur — EDESUR)'],
    ['avellaneda', 'Buenos Aires (GBA Sur — EDESUR)'],
    ['almirante brown', 'Buenos Aires (GBA Sur — EDESUR)'],
    ['berazategui', 'Buenos Aires (GBA Sur — EDESUR)'],
    ['florencio varela', 'Buenos Aires (GBA Sur — EDESUR)'],
    ['ezeiza', 'Buenos Aires (GBA Sur — EDESUR)'],
    ['esteban echeverria', 'Buenos Aires (GBA Sur — EDESUR)'],
    // GBA Norte (EDENOR)
    ['san isidro', 'Buenos Aires (GBA Norte — EDENOR)'],
    ['tigre', 'Buenos Aires (GBA Norte — EDENOR)'],
    ['san fernando', 'Buenos Aires (GBA Norte — EDENOR)'],
    ['vicente lopez', 'Buenos Aires (GBA Norte — EDENOR)'],
    ['san martin, buenos aires', 'Buenos Aires (GBA Norte — EDENOR)'],
    ['tres de febrero', 'Buenos Aires (GBA Norte — EDENOR)'],
    ['moreno', 'Buenos Aires (GBA Norte — EDENOR)'],
    ['merlo', 'Buenos Aires (GBA Norte — EDENOR)'],
    ['moron', 'Buenos Aires (GBA Norte — EDENOR)'],
    ['hurlingham', 'Buenos Aires (GBA Norte — EDENOR)'],
    ['ituzaingo', 'Buenos Aires (GBA Norte — EDENOR)'],
    // Córdoba city
    ['cordoba capital', 'Córdoba'],
    // Rosario
    ['rosario', 'Santa Fe'],
    // Tucumán
    ['san miguel de tucuman', 'Tucumán'],
    ['tucuman capital', 'Tucumán'],
  ]

  for (const [ciudad, provincia] of ciudades) {
    if (d.includes(ciudad)) return provincia
  }

  // Provincias por nombre directo
  const provincias: [string, string][] = [
    ['mendoza', 'Mendoza'],
    ['cordoba', 'Córdoba'],
    ['santa fe', 'Santa Fe'],
    ['ciudad autonoma de buenos aires', 'CABA'],
    ['caba', 'CABA'],
    ['tucuman', 'Tucumán'],
    ['salta', 'Salta'],
    ['jujuy', 'Jujuy'],
    ['catamarca', 'Catamarca'],
    ['la rioja', 'La Rioja'],
    ['san juan', 'San Juan'],
    ['san luis', 'San Luis'],
    ['santiago del estero', 'Santiago del Estero'],
    ['neuquen', 'Neuquén'],
    ['rio negro', 'Río Negro'],
    ['chubut', 'Chubut'],
    ['santa cruz', 'Santa Cruz'],
    ['tierra del fuego', 'Tierra del Fuego'],
    ['corrientes', 'Corrientes'],
    ['entre rios', 'Entre Ríos'],
    ['misiones', 'Misiones'],
    ['chaco', 'Chaco'],
    ['formosa', 'Formosa'],
    ['la pampa', 'La Pampa'],
  ]

  for (const [keyword, provincia] of provincias) {
    if (d.includes(keyword)) return provincia
  }

  // Fallback para "Buenos Aires" genérico → pedir al usuario que elija zona
  if (d.includes('buenos aires')) return 'Buenos Aires (GBA Sur — EDESUR)'

  return null
}

/** Devuelve el número de cliente guardado en un entry de servicio, sin importar el nombre del campo. */
export function getNumeroCliente(
  estado: Record<string, unknown> | undefined,
): string {
  if (!estado) return ''
  return (
    (estado.nic as string) ??
    (estado.nroCliente as string) ??
    (estado.nroCuenta as string) ??
    (estado.nis as string) ??
    ''
  )
}

/** Devuelve la config del impuesto municipal de Mendoza según el departamento elegido. */
export function getMendozaImpuestoConfig(deptoKey: string): ServicioConfigProvincia {
  const depto = DEPARTAMENTOS_MENDOZA.find((d) => d.key === deptoKey)
  return {
    key: deptoKey,
    label: depto ? `Imp. Municipal — ${depto.label}` : 'Impuesto Municipal',
    campo: 'Nro. de Cuenta',
    tipo: 'impuesto',
  }
}

/** Devuelve la config de un servicio buscando en todos los datos de provincia. */
export function getServicioConfig(key: string): ServicioConfigProvincia | undefined {
  // Impuesto municipal dinámico de Mendoza
  if (key.startsWith('imp_mza_')) {
    return getMendozaImpuestoConfig(key)
  }
  for (const svcs of Object.values(SERVICIOS_POR_PROVINCIA)) {
    const found = svcs.find((s) => s.key === key)
    if (found) return found
  }
  return undefined
}
