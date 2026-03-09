export default class Board{
    constructor(){
        this.grid = this.createGrid(10, 10); //cria um tabuleiro 10x10
        this.ships = []; //lista de navios não afundados no tabuleiro
        this.attacks = []; //lista de ataques já realizados
    }   

    createGrid(rows, cols){
        const grid = [];
        for(let i = 0; i < rows; i++){
            const row = new Array(cols).fill(null);
            grid.push(row);
        }   
        return grid;
    }

    isValidPlacement(ship, row, col, orientation) {
        if (row < 0 || row >= 10 || col < 0 || col >= 10) {
            return false;
        }

        if (orientation === 'horizontal') {
            if (col + ship.size > 10){
                return false;
            }
        } else {
            if (row + ship.size > 10){
                return false;
            }
        }
        //verifica se a posição já está ocupada
        for (let i = 0; i < ship.size; i++) {
            let targetRow;
            let targetCol;
            if (orientation === 'horizontal') {
                targetRow = row;
                targetCol = col + i;
            }else {
                targetRow = row + i;
                targetCol = col;
            }
            if (this.grid[targetRow][targetCol] instanceof Object) {
                return false;
            }
        }
        return true;
    }

    _applyShipToGrid(ship, row, col, orientation){
        ship.row = row;
        ship.col = col;
        ship.orientation = orientation;

        if(orientation === 'horizontal'){
            for(let i = 0; i < ship.size; i++){
                this.grid[row][col + i] = ship;
            }
        } else if (orientation === 'vertical'){
            for(let i = 0; i < ship.size; i++){
                this.grid[row + i][col] = ship;
            }
        }
    }

    _removeShipFromGrid(ship){
        if(ship.orientation === 'horizontal'){
            for(let i = 0; i < ship.size; i++){
                this.grid[ship.row][ship.col + i] = null;
            }
        } else if (ship.orientation === 'vertical'){
            for(let i = 0; i < ship.size; i++){
                this.grid[ship.row + i][ship.col] = null;
            }
        }
    }


    placeShip(ship, row, col, orientation){
        //row e col variam de 0 a 9
        //orientation pode ser 'horizontal' ou 'vertical'

        if(!this.isValidPlacement(ship, row, col, orientation)){
            throw new Error("Posição inválida para o navio");
        }
        this._applyShipToGrid(ship, row, col, orientation);
        this.ships.push(ship);
    }

    //método para movimentar navios (modo dinamico)
    moveShip(ship, direction){
        //direção pode ser 'up', 'down', 'left' ou 'right'
        if(ship.isSunk()){
            throw new Error("Não é possível mover um navio afundado");
        }

        let newRow = ship.row;
        let newCol = ship.col;

        switch(direction){
            case 'up':
                newRow -= 1;
                break;
            case 'down':
                newRow += 1;
                break;
            case 'left':
                newCol -= 1;
                break;
            case 'right':
                newCol += 1;
                break;
            default:
                throw new Error("Direção inválida");
        }

        for (let i = 0; i < ship.size; i++) {
            let targetRow = newRow;
            let targetCol = newCol;
            
            if (ship.orientation === 'horizontal') {
                targetCol += i;
            } else {
                targetRow += i;
            }

            const attackKey = `${targetRow},${targetCol}`;
            if (this.attacks.includes(attackKey)) {
                throw new Error("Movimento inválido! A nova posição inclui posições já atacadas.");
            }
        }

        this._removeShipFromGrid(ship); //remove o navio da posição atual temporariamente p/ evitar colisão com ele mesmo

        if(!this.isValidPlacement(ship, newRow, newCol, ship.orientation)){
            this._applyShipToGrid(ship, ship.row, ship.col, ship.orientation); //recoloca o navio na posição original
            throw new Error("Movimento inválido");
        }
        this._applyShipToGrid(ship, newRow, newCol, ship.orientation) //move o navio para a nova posição
    }

    receiveAttack(row, col){

        const attackKey = `${row},${col}`;
        if(this.attacks.includes(attackKey)){
            throw new Error("Posição já atacada");
        }

        this.attacks.push(attackKey);
        const target = this.grid[row][col];

        if(target instanceof Object){ 
            target.hit();
            if(target.isSunk()){
                return{
                    status: 'sunk', //acertou e afundou
                    ship: target
                };
            } else {
                return {
                    status: 'hit' //apenas acertou
                };
            }
        } else {
            return {
                status: 'miss' //errou
            };
        }
    }

    allShipsSunk(){
        return this.ships.every(ship => ship.isSunk());
    }

    //metodo para visualizar o tabuleiro
    //se hideShips==true, os navios não afundados são escondidos (tabuleiro adversário)
    //se hideShips==false, os navios são mostrados (tabuleiro próprio)
    getBoardView(hideShips= true){
        const view = [];

        for(let r=0; r < 10; r++){
            const row = [];
            for(let c=0; c < 10; c++){
                const target = this.grid[r][c];
                const attackKey = `${r},${c}`;
                const isAttacked = this.attacks.includes(attackKey);

                //se ja foi atacado
                if(isAttacked){
                    //acertou o navio
                    if(target instanceof Object){
                        if(target.isSunk()){
                            row.push('SUNK'); //navio afundado
                        }
                        else{
                            row.push('HIT'); //navio acertado
                        }
                    }
                    else{
                        row.push('MISS'); //acertou a agua
                    }
                }
                //se não foi atacado
                else{
                    if(hideShips){
                        row.push('WATER'); //para o adversário, tudo é água
                    }
                    else{
                        if(target instanceof Object){
                            row.push('SHIP');
                        }
                        else{
                            row.push('WATER');
                        }
                    }
                }
            }
            view.push(row);
        }
        return view;
    }
}