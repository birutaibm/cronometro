---
description: 'Revisa Pull Request no github'
agent: builder
---

Revise o pull request do projeto Cronômetro no github.

Utilise exclusivamente o MCP github para isso, caso tenha problema com alguma funcionalidade do MCP, informe ao usuário e o instrua sobre possíveis soluções.

Caso o usuário não tenha especificado qual PR deve ser revisado, liste todos os PRs abertos pedindo que o usuário escolha qual deve ser revisado. Inclua nesta listagem: branch de origem e destino, título e autor.

Não faça correções, apenas analise as alterações e deixe comentários no próprio PR para serem corrigidos pelo desenvolvedor.

Caso o PR referêncie alguma issue, sua revisão deve verificar se o PR de fato cobre totalmente o que foi pedido na issue.

Pontos de atenção:
- Testes que foram modificados/removidos sem ter relação com o problema que está sendo tratado no PR.
- Testes adicionados que não testam nada de verdade, lidam apenas com mocks, passando a falsa segurança de estar testando algo que na verdade não estão.
- Funcionalidades novas que não possuem testes, e portanto, não temos prova de que ela de fato funcionam.
- Arquivos `.md` do projeto que se tornarão errados/desatualizados com as mudanças que foram feitas no PR.
- Possíveis vulnerabilidades novas que estão incluídas pelo PR.
- Downgrade de libs ou inclusão de libs deprecated sem nenhuma justificativa aparente.

Ao final de sua analise, caso não encontre nenhum problema, marque o PR como aprovado.

Retorne ao usuário um resumo de seus apontamentos e conclusões.
