# UP Eventos — Projeto Web Unificado

Projeto único que combina a apresentação visual do protótipo UP Eventos com as funções do protótipo mais completo: acesso por perfil, câmera, galeria, espaços, agenda, orçamento, serviços, tema claro/escuro e contato.

## Abrir no VS Code
1. Extraia o ZIP.
2. No VS Code, use **Arquivo → Abrir Pasta** e selecione `up-eventos-completo`.
3. Instale a extensão **Live Server** se necessário.
4. Abra `index.html` e clique em **Go Live**.

## Funcionalidades incluídas
- Página pública de apresentação, com poucas frases, imagens grandes, animações suaves, galeria ampliável e contato.
- Logotipo original UP Eventos no cabeçalho, acesso, área interna e rodapé.
- Escolha de perfil Cliente ou Organizador antes do cadastro/login; nome do usuário aparece após o acesso.
- Recursos de planejamento ficam atrás do login demonstrativo.
- Tema claro/escuro.
- Pesquisa de espaços demonstrativos com filtros por categoria/capacidade e favoritos.
- Serviços selecionáveis: buffet, decoração, DJ, som, iluminação e cerimonial.
- Câmera real via navegador, seleção de câmera quando disponível, captura com prévia, salvar na galeria, tirar outra foto, parar a câmera e upload de imagens.
- Galeria com visualização ampliada, download e exclusão.
- Agenda com data, horário, tipo de evento, observações, listagem e cancelamento local.
- Orçamento demonstrativo com tipo, número de convidados, data, espaço, faixa de orçamento e serviços. Solicitações aparecem na área do cliente e na visão do organizador neste navegador; o organizador pode atualizar o status.
- Exportação de solicitações em CSV e impressão da lista para escolher “Salvar como PDF”.
- WhatsApp: https://wa.me/5511969663554 ( +55 11 96966-3554 ).

## Publicação no GitHub Pages
1. Envie o conteúdo da pasta `up-eventos-completo` para a raiz do seu repositório GitHub.
2. Em **Settings → Pages**, selecione a branch principal e `/ (root)`.
3. Abra o endereço HTTPS gerado. A câmera precisa de autorização e de HTTPS ou localhost.

## Limitações honestas
Este é um protótipo front-end para demonstração escolar. Login, galeria, favoritos, agenda e orçamentos são salvos no navegador por `localStorage`; não há servidor, contas seguras, envio real de orçamento nem sincronização entre dispositivos. A área de organizador vê registros criados nesse mesmo navegador. Espaços e capacidades apresentados são exemplos fictícios, identificados como demonstrativos. Fotografias de referência são carregadas de URLs externas e exigem internet.
