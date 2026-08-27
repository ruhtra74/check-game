/**
 * Gère les flux de chaînes TCP en reconstituant les messages séparés par "\n".
 * Les sockets TCP envoient des données sous forme de flux (streams), et
 * un `data` event peut contenir de multiples messages ou seulement un demi-message.
 */
export class LineBuffer {
  private buffer: string;

  constructor() {
    this.buffer = '';
  }

  /**
   * Ajoute de nouvelles données au buffer et retourne les lignes complètes extraites.
   */
  public push(data: string): string[] {
    this.buffer += data;
    const lines = this.buffer.split('\n');
    
    // pop() retire toujours le bloc de fin. 
    // S'il finit par \n, pop() retournera '', sinon il retourne la fin inachevée.
    this.buffer = lines.pop() || '';
    
    return lines.filter((line) => line.trim().length > 0);
  }
}
