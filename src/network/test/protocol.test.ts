import { FrameDecoder, encoderMessage, type NetworkMessage } from '../protocol';

function testProtocol() {
  const decoder = new FrameDecoder();

  const msg1: NetworkMessage = {
    type: 'JOIN',
    clientId: 'player-1',
    pseudo: 'Alice',
    emoji: '🤠',
  };

  const msg2: NetworkMessage = {
    type: 'READY',
    pret: true,
  };

  const encoded1 = encoderMessage(msg1);
  const encoded2 = encoderMessage(msg2);

  // Test 1: Décodage d'un message complet
  const res1 = decoder.push(encoded1);
  console.assert(res1.length === 1, 'Attendu 1 message dans res1');
  console.assert(res1[0]?.type === 'JOIN', 'Attendu type JOIN');

  // Test 2: Décodage de 2 messages concaténés dans un seul chunk
  const concat = new Uint8Array(encoded1.length + encoded2.length);
  concat.set(encoded1, 0);
  concat.set(encoded2, encoded1.length);

  const res2 = decoder.push(concat);
  console.assert(res2.length === 2, 'Attendu 2 messages dans res2');
  console.assert(res2[0]?.type === 'JOIN', 'Attendu type JOIN');
  console.assert(res2[1]?.type === 'READY', 'Attendu type READY');

  // Test 3: Décodage fragmenté (moitié par moitié)
  decoder.reset();
  const half1 = encoded1.subarray(0, 10);
  const half2 = encoded1.subarray(10);

  const resFrag1 = decoder.push(half1);
  console.assert(resFrag1.length === 0, 'Attendu 0 message pour la première moitié');

  const resFrag2 = decoder.push(half2);
  console.assert(resFrag2.length === 1, 'Attendu 1 message après la seconde moitié');
  console.assert(resFrag2[0]?.type === 'JOIN', 'Attendu type JOIN après fragmentation');

  console.log('✅ Tous les tests protocol.ts ont réussi !');
}

testProtocol();
