const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d')

canvas.width = 0 || (window.innerWidth * 0.95);
canvas.height = 0 || (window.innerHeight * 0.95);

class GameOfLive
{
	static self = undefined;
	constructor(settings = {})
	{
		if(GameOfLive.self == undefined)
		{
			this.RULE_B = settings['RULE_B'] || '3';
			this.RULE_S = settings['RULE_S'] || '23';

			this.fieldW = Math.max(settings['fieldW'], 0) || 5;
			this.fieldH = Math.max(settings['fieldH'], 0) || 5;

			this.cellW;
			this.cellH;
			this.cellSize;

			this.field = [];

			this.animationID;

			this.isRun;

			this.imageData;

			this.FPS;
			this.pTime;

			this.init();
			this.render();
		}
		else return GameOfLive.self;
	}

	init()
	{
		for(let i = 0; i < this.fieldW * this.fieldH; i++)
			this.field.push(false);

		this.cellW = Math.round(canvas.width / this.fieldW);
		this.cellH = Math.round(canvas.height / this.fieldH);
		this.cellSize = Math.min(this.cellW, this.cellH);

		canvas.width = this.cellSize * this.fieldW;
		canvas.height = this.cellSize * this.fieldH;

		this.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		ctx.lineWidth = 1;

		this.FPS = 30;

		this.isRun = false;

		canvas.addEventListener('mousedown', (e) => this.cbMouse(e));
		window.addEventListener('keydown', (e) => this.cbKeyDown(e));

		GameOfLive.self = this;
	}

	cbMouse(e)
	{
		let x = Math.floor(e.clientX - canvas.getBoundingClientRect().left);
		let y = Math.floor(e.clientY - canvas.getBoundingClientRect().top);

	    let cellX = Math.floor(x / (this.cellSize + 0));
	    let cellY = Math.floor(y / (this.cellSize + 0));

		if(e.button == 0)
			this.field[cellY * this.fieldW + cellX] = true;

		if(e.button == 1)
			this.field[cellY * this.fieldW + cellX] = false;   

		this.render();
	}

	cbKeyDown(e)
	{
		if(e.code == 'Space')
		{
			if(this.isRun) cancelAnimationFrame(this.animationID);
			else this.run();

			this.isRun = !this.isRun;
		}

		if(e.code == 'ArrowRight')
		{
			cancelAnimationFrame(this.animationID);
			this.isRun = false;
			this.logic();
		}

		if(e.code == 'ArrowUp')
			if(this.FPS < 60) this.FPS++;

		if(e.code == 'ArrowDown')
			if(this.FPS > 1) this.FPS--;

		if(e.code == 'KeyR')
		{
			cancelAnimationFrame(this.animationID);
			this.isRun = false;
			this.field.fill(false);
		}

		this.render();
	}

	logic()
	{
		const _field = [...this.field];

		for(let i = 0; i < this.field.length; i++)
		{
			let x = i % this.fieldW;
			let y = Math.floor(i / this.fieldW);

			let neighbours = [];

			/*ortho*/
			if(x > 0) neighbours.push(i - 1);
			if(x < this.fieldW - 1) neighbours.push(i + 1);
			if(y > 0) neighbours.push(i - this.fieldW);
			if(y < this.fieldH - 1) neighbours.push(i + this.fieldW);

			/*diag*/
			if(x > 0 && y > 0) neighbours.push(i - this.fieldW - 1);
			if(x > 0 && y < this.fieldH - 1) neighbours.push(i + this.fieldW - 1);
			if(x < this.fieldW - 1 && y > 0) neighbours.push(i - this.fieldW + 1);
			if(x < this.fieldW - 1 && y < this.fieldH - 1) neighbours.push(i + this.fieldW + 1);

			let count = 0;
			for(let index of neighbours)
				if(_field[index]) count++;

			let is = false;
			for(let rule of this.RULE_B)
			{
				if(rule == count && !_field[i])
				{
					this.field[i] = true;
					is = true;
					break;
				}
			}

			if(!is)
			{
				for(let rule of this.RULE_S)
				{
					if(rule == count && _field[i])
					{
						is = true;
						break;
					}
				}
			}

			if(!is) this.field[i] = false;
		}
	}

	drawCells()
	{
		for(let i = 0; i < this.field.length; i++)
		{
			let x = i % this.fieldW;
			let y = Math.floor(i / this.fieldW);

			let color = {r: 0, g: 0, b: 0};

			if(this.field[i])
			{	
				if(this.isRun) {color.r = 221, color.g = 221, color.b = 221}
				else {color.r = 136, color.g = 136, color.b = 136}
			}

			for(let _i = 0; _i < this.cellSize * this.cellSize; _i++)
			{
				let _x = _i % this.cellSize;
				let _y = Math.floor(_i / this.cellSize);

				let __x = x * this.cellSize + _x;
				let __y = y * this.cellSize + _y;

				let index = (__y * this.imageData.width + __x) * 4;

				this.imageData.data[index + 0] = color.r;
				this.imageData.data[index + 1] = color.g;
				this.imageData.data[index + 2] = color.b;
				this.imageData.data[index + 3] = 255;
			}

		}

		ctx.putImageData(this.imageData, 0, 0)
	}

	drawLines()
	{
		if(this.isRun) ctx.strokeStyle = '#fff';
		else ctx.strokeStyle = '#aaa';
		ctx.beginPath();
			for(let i = 0; i < this.fieldW + 1; i++)
			{
				ctx.moveTo((this.cellSize + 0) * i, 0);
				ctx.lineTo((this.cellSize + 0) * i, canvas.height);
			}

			for(let i = 0; i < this.fieldH + 1; i++)
			{    
				ctx.moveTo(0, (this.cellSize + 0) * i);
				ctx.lineTo(canvas.width, (this.cellSize + 0) * i);
			}
		ctx.closePath();
		ctx.stroke();
	}

	render()
	{
		this.drawCells();
		this.drawLines();
	}

	run(cTime = 0)
	{
		let dt = cTime - (GameOfLive.self.pTime || 0);
		if(dt > 1000 / GameOfLive.self.FPS)
		{
			GameOfLive.self.pTime = cTime;

			GameOfLive.self.render();
			GameOfLive.self.logic();
			GameOfLive.self.animationID = requestAnimationFrame(GameOfLive.self.run);
		}
		else GameOfLive.self.animationID = requestAnimationFrame(GameOfLive.self.run);
	}
}

const game = new GameOfLive(	{fieldW: 100, fieldH: 100, RULE_B: '', RULE_S: ''}	)