# Edição LIBRAS SignWriting — Língua Brasileira de Sinais (BZS / LIBRAS)
**Projeto:** Lattice — Editor de Grafos Distribuídos Acessível com Capacidades de Objeto  
**Escrita de Sinais:** Sutton SignWriting (`FSW` & Unicode `SWU`) · Ordem `SVO`  
**Contato:** `yottzumm@gmail.com` · <https://github.com/coderextreme/OCG-DDS>

---

## 1. Visão Geral (`Glosa LIBRAS`)
- **Glosa LIBRAS:** `[sobrancelhas-erguidas] TÓPICO :: NÓ-A-NÓ LIGAR-ARCO PRONTO :: CHAVE-PODER :: GRUPO CONFIRMAR [aceno]`
- **Sequência FSW:**
  `M535x540S31400482x445S10000505x495S26500512x478 M535x540S31400482x445S10000505x495S10010465x500S27100512x478 M535x540S30400482x445S1f000505x495S1f010465x500S20b00492x488S28800512x478 M535x540S30400482x445S14000505x495S14010465x500S2a200512x478`
- **Unicode SWU:**
  `𝨄𝠀𝤯 𝨄𝠀𝠀𝤿 𝧴𝢻𝢻𝤋𝥘 𝧴𝡌𝡌𝦌`

## 2. Operações Principais em LIBRAS SignWriting
| Operação | Glosa LIBRAS | FSW | Unicode SWU |
| :--- | :--- | :--- | :--- |
| **Conectar Arco** | `NÓ-A-NÓ · LIGAR-ARCO · PRONTO` | `M535x540S31400482x445S10000505x495S10010465x500S27100512x478` | `𝨄𝠀𝠀𝤿` |
| **Lote em Grupo** | `GRUPO · CONFIRMAR` | `M535x540S31400482x445S16d00505x495S16d10465x500S28600512x478` | `𝨄𝡬𝡬𝥖` |
| **Acesso Negado** | `CHAVE-PODER · PROIBIDO · PARAR` | `M535x540S30300482x445S14700505x495S14710465x500S20900492x488S22a00512x478` | `𝧳𝡐𝡐𝤉𝤚` |
| **Convergência CRDT** | `TODOS · UNIR-IGUAL` | `M535x540S30400482x445S14700505x495S14710465x500S20500492x488S28800512x478` | `𝧴𝡐𝡐𝤅𝥘` |

## 3. Instalação
```bash
git clone https://github.com/coderextreme/OCG-DDS && cd OCG-DDS && npm install && npm run dev
```
Selecione **SignWriting** -> **`LIBRAS · Língua Brasileira de Sinais`**.
