import { NextResponse } from 'next/server'
import { getSession, hashPassword } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireSuperadminApi() {
  const session = await getSession()
  if (!session || session.rol !== 'superadmin') {
    return null
  }
  return session
}

export async function GET() {
  try {
    const session = await requireSuperadminApi()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const supabase = createAdminClient()

    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(empresas || [])
  } catch (error) {
    console.error('Error listando empresas:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSuperadminApi()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const supabase = createAdminClient()

    const body = await request.json()
    const { nombre, rut, telefono, email, password } = body

    if (!nombre || !rut || !password) {
      return NextResponse.json({ error: 'Nombre, RUT y password son obligatorios' }, { status: 400 })
    }

    // 1️⃣ Crear la empresa
    const { data: empresa, error: empError } = await supabase
      .from('empresas')
      .insert({
        nombre,
        rut,
        telefono,
        email,
        activo: true,
      })
      .select()
      .single()

    if (empError) {
      return NextResponse.json({ error: empError.message }, { status: 500 })
    }

    // 2️⃣ Generar email del admin a partir del RUT (formato admin@<rut>.cl)
    const emailAdmin = email || `${rut.replace(/[^0-9kK]/g, '').toLowerCase()}@test.cl`

    // 3️⃣ Hashear la password
    const passwordHash = await hashPassword(password)

    // 4️⃣ Crear el usuario admin vinculado a la empresa
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .insert({
        empresa_id: empresa.id,
        email: emailAdmin,
        password_hash: passwordHash,
        nombre: `Admin ${empresa.nombre}`,
        rol: 'admin',
        activo: true,
      })
      .select()
      .single()

    if (userError) {
      // Intento derollback: borrar la empresa creada
      await supabase.from('empresas').delete().eq('id', empresa.id)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    return NextResponse.json({
      empresa,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    })
  } catch (error) {
    console.error('Error creando empresa + admin:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}