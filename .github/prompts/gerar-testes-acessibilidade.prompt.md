---
description: Gerar testes de acessibilidade com node:test para um módulo do frontend.
name: gerar-testes-acessibilidade
argument-hint: caminho do modulo (ex. frontend/src/)
agent: agent
---

# Gerar testes do backend

Gere testes automatizados de acessibilidade para o módulo `${input:modulo:caminho do modulo}` usando o runner nativo `node:test` e `node:assert`.

Requisitos:

- Cubra os casos de sucesso e de erro principais.
- Mantenha os testes isolados e legíveis.
- Coloque os testes em `frontend/test`.
- Não dependa de bibliotecas externas. .
