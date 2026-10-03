export const LIMIT = 12000;
export function validNote(n) {
  return n && Number.isInteger(n.room) && n.room >= 1 && n.room <= 3 &&
    typeof n.text === 'string' && n.text.length <= LIMIT &&
    Number.isSafeInteger(n.clock) && n.clock >= 0 && n.clock < Number.MAX_SAFE_INTEGER &&
    typeof n.author === 'string' && /^[a-zA-Z0-9-]{0,64}$/.test(n.author);
}
export function newer(a, b) {
  return a.clock > b.clock || (a.clock === b.clock && a.author > b.author);
}
export class Notebook {
  constructor(author, saved = []) {
    this.author = author;
    this.notes = [1,2,3].map(room => ({room, text:'', clock:0, author:''}));
    for (const note of saved) this.receive(note);
  }
  edit(room, text) {
    if (![1,2,3].includes(room) || typeof text !== 'string' || text.length > LIMIT) throw Error('Texto ou sala inválidos.');
    const clock = Math.max(...this.notes.map(n => n.clock)) + 1;
    const note = {room, text, clock, author:this.author};
    if (!validNote(note)) throw Error('Limite de versões atingido.');
    this.notes[room-1] = note;
    return note;
  }
  receive(note) {
    if (!validNote(note) || !newer(note, this.notes[note.room-1])) return false;
    this.notes[note.room-1] = {...note};
    return true;
  }
}
export function readSignal(text, type) {
  if (typeof text !== 'string' || text.length > 100000) throw Error('Código inválido.');
  let value;
  try { value = JSON.parse(text); } catch { throw Error('Cole o código completo, incluindo as chaves.'); }
  if (value.v !== 1 || value.type !== type || typeof value.sdp !== 'string' || !value.sdp.startsWith('v=0'))
    throw Error(type === 'offer' ? 'Use um código de convite.' : 'Use um código de resposta.');
  return {type:value.type, sdp:value.sdp};
}
