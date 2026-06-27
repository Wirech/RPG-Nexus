B Text
SPEC_03_BACKEND.md
Nexus do Mestre-
Especificação do Backend
Configuração
Geral
0 backe
REST
Express
TypeScript
Todas as rotas (exceto
th/login €
Jauth/register) exigem JWT válido no header Authorization
Bearer <token). Rotas marcadas
[ADMIN
padrão:
Base URL: / api/v1
Middleware de Auditoria
Criar aud=
eware 1
que intercepta automaticamente
requisicoes POST
PATCHe DELETE
registra na tabela AuditLog com:
d (do token JWT)
entity
entityId {extraido dos params)
método HTTP)
oldVal
(serializado como JSON string)
WebSocket
Eventos (socket.io)
Eventos emitidos pelo servidor
cliente
Evento
Pavload
Descricho
1 solicitação de
'aCe60
tedAt
admin)
:appr
apro
Notifica uIsuaric
, foi recusado
combatId, participantId,
Atualizacao
combat
Jpdated
vall
combate
combat:event
combate
registrado
combat:round
Mudanca de rodada
sage, type
Notificace
'5 gerais
Eventos emitido
pelo cliente
servidor
Evento
Pavload
Descricão
Entrar na sala de
combat:join
combate
combat:
Sair da sala
combate
Rotas da API
Auth (api/vlfauth)
Jregister
Post
flogin
Login,
GET
Dados
Post
Jlogol
Inva
(blacklist
POS
Iregist
30) " ,
(min
POST
Usuários (/ api/vl/u
[ADMIN]
tod
usuár
GET
List
solicitaçãe
PoSt
':id
PoST
{reject/:id
Recusar
(body
reason?
DELETE
Remover
usuário
Post
J:id/block
Bloquear usuáric
Post
J:id/unblock
Desbloquear usuário
Personag
'acters)
[ADMIN] Listar
todos
[PLAYER]
revelados
próp
Pgroups
Listar grupos
personagens
Post
Pgroups
[ADMIN] Criar grupo
Jgroups/:id
[ADMIN]
Editar
DELETE
/groups/:id
[ADMIN]
Deletar grupo
personagem
(verificar
permissão)
Post
[ADMIN]
Criar personagem
F:id
[ADMIN]
Editar
personagen
completo
PATCH
f:id/vitals
[ADMIN|PLAYER_ONNER ]
Atualizar PV/SAN/PE
PATCH
F:id/conditions
[ADMIN]
alizar
condicoes
Post
J:id/skills
[ADMIN] Adicior
J:id/skills/ :skillId
[ADMIN] Editar
DELETP
[ADH
PoSt
lities
[ADMIN]
lityId
[ADMIN]
DELETE
e5/:abi
[ADMIN]
Monstros (/api/vl
[ADMIN]
monstros
4 Ver
monstro
4 Criar
Monstro
Editar
DELETE
Monstro
Post
sidattacks
Adicionar ataque
J:id/attacks/:attackId
Editar ataque
DELE
F:id/attacks/:attackId
Remover
ataque
PoST
F:id/abilities
Adicionar habilidade
J:id/abilities
abilityId
Editar habilidade
DELETE /:id/abilities
abilityI
habilidade
Post
Ambientes (/api/vl/environments)
[ADMIN]
LAYER T
Ver
permissão)
[ADMIN]
Criar
[ADMIN]
Editar ambiente
DELE
J:id
[ADMIN]
Deletar ambiente
J:id/il
[ADMIN]
Uploa
DELET
J:id/images/ :imageId
[ADMIN] Remover
PATCH
F:id/reveal
Revelar ocul
Documentos ( /ap
nts)
[ADMIN]
[PLAYER]
Revelados
4 Ver
umento
(verificar
Iis5ã0)
PoST
[ADMIN] Criar documento
[ADMIN]
Editar
documente
DELETE
[ADMIN] Deletar
Post
F:id/images
[ADMIN] Upload
imagem
DELE
f:id/images/ :imageId
[ADHIN] Remover imagem
PATC
F:id/reveal
[ADMIN]
'elarocul
Combate (/api/vl/combat)
[ADMIN]
Listar
combates
Jactive
ativos
(partic
PoSt
[ADMIN]
Criar
(body:
Icipants[]
Post
[ADMII
participant
DELETE
J:id/oarticioants/
ipantIo
icipante
PATCH
J:id/oarticipants/:DarticipantId/vitals
Atualizar PV/SAN/PE
(emite
socket
PATCH
J:id/oarticioants/:DarticipantId conditions
Atualizar condições
J:id/events
Registrar
evento
combate
PoSt
J:id next-round
[ADMIN] Avançar rodada
F:id finish
ADMIN]
Encerrar combat
DELETE  :id
[ADMIN]
Deletar combate
PATCH vitals body:
"field
"value
"description":
"Dano
mordida
fungo"
"sourceId" :
"participantId_opcional
Notas
Sessão (/api/vl/sessions)
[ADMIN]
Ver
Post
Editar
DELETE
J:id
Log de Auditoria (api/vl/audit)
[ADMIN]
log
(querv: entityTvpe
userId
from,
ntity/:typel:id
Logs
entidade
especifica
Tratamento de Erros
no formato:
"message
ERROR CODE
Codiç
Reouest (validacao falhoul
+ Unauthorized
token
token invalidol
Forbidden
permisshol
Nol Foung
Conflici
username já existe)
500 - Internal Server Error
Seed Inicial
0 arquivo prisma seed.ts deve criar:
Usuario admin com credenciais
variaveis
'ADMI
USERNANE
'ADMIN PASSWORD
) (apenas
field,
change
monstro
imagem
imagem

