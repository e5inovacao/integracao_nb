import express from 'express';
import type { Request, Response } from 'express';
import { supabaseAdmin } from '../../supabase/server.ts';

const router = express.Router();

// GET /api/consultores - Listar todos os consultores
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: consultores, error } = await supabaseAdmin
      .from('consultores')
      .select('*')
      .order('nome');

    if (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar consultores' });
      return;
    }

    res.status(200).json({ success: true, data: consultores });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro inesperado ao buscar consultores' });
  }
});

// GET /api/consultores/:id - Buscar consultor específico
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;
    const consultorId = Number(idParam);
    if (!Number.isFinite(consultorId)) {
      res.status(400).json({ success: false, error: 'ID inválido' });
      return;
    }

    const { data: consultor, error } = await supabaseAdmin
      .from('consultores')
      .select('*')
      .eq('id', consultorId)
      .single();

    if (error || !consultor) {
      res.status(404).json({ success: false, error: 'Consultor não encontrado' });
      return;
    }

    res.status(200).json({ success: true, data: consultor });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro inesperado ao buscar consultor' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[PUT /api/consultores/:id] hit', { path: req.path, method: req.method });
    const idParam = req.params.id;
    const consultorId = Number(idParam);
    if (!Number.isFinite(consultorId)) {
      res.status(400).json({ success: false, error: 'ID inválido' });
      return;
    }

    const { nome, email, telefone, ativo, senha } = req.body || {};

    const { data: consultor, error: getError } = await supabaseAdmin
      .from('consultores')
      .select('id, auth_user_id')
      .eq('id', consultorId)
      .single();

    if (getError || !consultor) {
      res.status(404).json({ success: false, error: 'Consultor não encontrado' });
      return;
    }

    const { error: updError } = await supabaseAdmin
      .from('consultores')
      .update({
        nome,
        email,
        telefone: telefone ?? '',
        ativo: ativo ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', consultorId);

    if (updError) {
      res.status(500).json({ success: false, error: 'Erro ao atualizar dados do consultor' });
      return;
    }

    if (senha && String(senha).trim().length > 0) {
      const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(consultor.auth_user_id, {
        password: String(senha),
      });
      if (passError) {
        res.status(500).json({ success: false, error: 'Erro ao atualizar senha do consultor' });
        return;
      }
    }

    res.status(200).json({ success: true, message: 'Consultor atualizado com sucesso' });
  } catch (error) {
    console.error('[PUT /api/consultores/:id] unexpected error', error);
    res.status(500).json({ success: false, error: 'Erro inesperado ao atualizar consultor' });
  }
});

// PATCH /api/consultores/:id/password - Alterar senha diretamente (admin)
router.patch('/:id/password', async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;
    const consultorId = Number(idParam);
    if (!Number.isFinite(consultorId)) {
      res.status(400).json({ success: false, error: 'ID inválido' });
      return;
    }

    const { password } = req.body || {};
    if (!password || String(password).trim().length < 8) {
      res.status(400).json({ success: false, error: 'Senha inválida (mínimo 8 caracteres)' });
      return;
    }

    const { data: consultor, error: getError } = await supabaseAdmin
      .from('consultores')
      .select('id, auth_user_id, email')
      .eq('id', consultorId)
      .single();

    if (getError || !consultor) {
      res.status(404).json({ success: false, error: 'Consultor não encontrado' });
      return;
    }

    if (!consultor.auth_user_id) {
      res.status(409).json({ success: false, error: 'auth_user_id não vinculado ao consultor' });
      return;
    }

    const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(consultor.auth_user_id, {
      password: String(password),
    });
    if (passError) {
      res.status(500).json({ success: false, error: 'Erro ao atualizar senha do consultor' });
      return;
    }

    res.status(200).json({ success: true, message: 'Senha atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro inesperado ao atualizar senha' });
  }
});

// POST /api/consultores/:id/password-temp - Gerar senha temporária (admin)
router.post('/:id/password-temp', async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;
    const consultorId = Number(idParam);
    if (!Number.isFinite(consultorId)) {
      res.status(400).json({ success: false, error: 'ID inválido' });
      return;
    }

    const { data: consultor, error: getError } = await supabaseAdmin
      .from('consultores')
      .select('id, auth_user_id, email')
      .eq('id', consultorId)
      .single();

    if (getError || !consultor) {
      res.status(404).json({ success: false, error: 'Consultor não encontrado' });
      return;
    }

    if (!consultor.auth_user_id) {
      res.status(409).json({ success: false, error: 'auth_user_id não vinculado ao consultor' });
      return;
    }

    // Gerar senha temporária forte
    const temp = Math.random().toString(36).slice(-10) + 'A1!';
    const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(consultor.auth_user_id, {
      password: temp,
    });
    if (passError) {
      res.status(500).json({ success: false, error: 'Erro ao definir senha temporária' });
      return;
    }

    res.status(200).json({ success: true, message: 'Senha temporária definida', data: { tempPassword: temp } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro inesperado ao definir senha temporária' });
  }
});

// POST /api/consultores/:id/password-reset - Gerar link de recuperação (admin)
router.post('/:id/password-reset', async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;
    const consultorId = Number(idParam);
    if (!Number.isFinite(consultorId)) {
      res.status(400).json({ success: false, error: 'ID inválido' });
      return;
    }

    const { data: consultor, error: getError } = await supabaseAdmin
      .from('consultores')
      .select('id, auth_user_id, email')
      .eq('id', consultorId)
      .single();

    if (getError || !consultor || !consultor.email) {
      res.status(404).json({ success: false, error: 'Consultor não encontrado ou e-mail ausente' });
      return;
    }

    // Tentar gerar link de recuperação via Admin API
    let link: string | null = null;
    try {
      // Alguns ambientes suportam generateLink; se falhar, retorna mensagem amigável
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: consultor.email,
      } as any);
      link = (linkData as any)?.action_link || null;
    } catch (e) {
      // Fallback: instruir frontend a disparar reset padrão por e-mail
      link = null;
    }

    res.status(200).json({ success: true, message: 'Solicitação de recuperação registrada', data: { recoveryLink: link } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro inesperado ao gerar link de recuperação' });
  }
});

export default router;