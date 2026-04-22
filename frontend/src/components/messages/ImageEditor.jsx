import { useState, useRef, useEffect, useCallback } from "react";
import { IoClose, IoColorPalette, IoText, IoBrush, IoCheckmark } from "react-icons/io5";

const COLORS = ["#ffffff", "#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#007aff", "#5856d6", "#000000"];
const BRUSH_SIZES = [2, 4, 8, 12];

const ImageEditor = ({ isOpen, onClose, imageFile, onSave }) => {
	const canvasRef = useRef(null);
	const [tool, setTool] = useState("draw"); // draw, text
	const [color, setColor] = useState("#ff3b30");
	const [brushSize, setBrushSize] = useState(4);
	const [isDrawing, setIsDrawing] = useState(false);
	const [textInput, setTextInput] = useState("");
	const [textPos, setTextPos] = useState(null);
	const [imageLoaded, setImageLoaded] = useState(false);
	const imgRef = useRef(null);
	const drawingsRef = useRef([]);

	// Load image onto canvas
	useEffect(() => {
		if (!isOpen || !imageFile) return;

		const img = new Image();
		img.onload = () => {
			imgRef.current = img;
			const canvas = canvasRef.current;
			if (!canvas) return;

			// Scale to fit screen
			const maxW = Math.min(window.innerWidth - 40, 800);
			const maxH = Math.min(window.innerHeight - 200, 600);
			const scale = Math.min(maxW / img.width, maxH / img.height, 1);

			canvas.width = img.width * scale;
			canvas.height = img.height * scale;

			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			drawingsRef.current = [];
			setImageLoaded(true);
		};

		if (imageFile instanceof File) {
			img.src = URL.createObjectURL(imageFile);
		} else {
			img.src = imageFile;
		}

		return () => {
			if (img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
		};
	}, [isOpen, imageFile]);

	const redraw = useCallback(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		const img = imgRef.current;
		if (!canvas || !ctx || !img) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

		// Replay drawings
		for (const action of drawingsRef.current) {
			if (action.type === "path") {
				ctx.beginPath();
				ctx.strokeStyle = action.color;
				ctx.lineWidth = action.size;
				ctx.lineCap = "round";
				ctx.lineJoin = "round";
				const pts = action.points;
				if (pts.length > 0) {
					ctx.moveTo(pts[0].x, pts[0].y);
					for (let i = 1; i < pts.length; i++) {
						ctx.lineTo(pts[i].x, pts[i].y);
					}
					ctx.stroke();
				}
			} else if (action.type === "text") {
				ctx.font = "bold 20px sans-serif";
				ctx.fillStyle = action.color;
				ctx.fillText(action.text, action.x, action.y);
			}
		}
	}, []);

	const getPos = (e) => {
		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();
		const clientX = e.touches ? e.touches[0].clientX : e.clientX;
		const clientY = e.touches ? e.touches[0].clientY : e.clientY;
		return {
			x: clientX - rect.left,
			y: clientY - rect.top,
		};
	};

	const handlePointerDown = (e) => {
		if (tool === "draw") {
			const pos = getPos(e);
			setIsDrawing(true);
			drawingsRef.current.push({
				type: "path",
				color,
				size: brushSize,
				points: [pos],
			});
		} else if (tool === "text") {
			const pos = getPos(e);
			setTextPos(pos);
		}
	};

	const handlePointerMove = (e) => {
		if (!isDrawing || tool !== "draw") return;
		const pos = getPos(e);
		const current = drawingsRef.current[drawingsRef.current.length - 1];
		if (current) {
			current.points.push(pos);
			redraw();
		}
	};

	const handlePointerUp = () => {
		setIsDrawing(false);
	};

	const handleAddText = () => {
		if (!textInput.trim() || !textPos) return;
		drawingsRef.current.push({
			type: "text",
			color,
			text: textInput,
			x: textPos.x,
			y: textPos.y,
		});
		redraw();
		setTextInput("");
		setTextPos(null);
	};

	const handleSave = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.toBlob((blob) => {
			if (blob) {
				const file = new File([blob], `edited-${Date.now()}.jpg`, { type: "image/jpeg" });
				onSave(file);
				onClose();
			}
		}, "image/jpeg", 0.9);
	};

	const handleUndo = () => {
		drawingsRef.current.pop();
		redraw();
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 bg-black/95 flex flex-col'>
			{/* Toolbar */}
			<div className='flex items-center justify-between px-4 py-3'>
				<button onClick={onClose} className='p-2 text-white hover:bg-white/10 rounded-full'>
					<IoClose className='w-6 h-6' />
				</button>
				<div className='flex items-center gap-2'>
					<button
						onClick={() => setTool("draw")}
						className={`p-2 rounded-lg transition-colors ${tool === "draw" ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}
					>
						<IoBrush className='w-5 h-5' />
					</button>
					<button
						onClick={() => setTool("text")}
						className={`p-2 rounded-lg transition-colors ${tool === "text" ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}
					>
						<IoText className='w-5 h-5' />
					</button>
					<button
						onClick={handleUndo}
						className='px-3 py-1.5 text-sm text-slate-300 hover:text-white'
					>
						Undo
					</button>
				</div>
				<button
					onClick={handleSave}
					className='flex items-center gap-1 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-xl transition-colors'
				>
					<IoCheckmark className='w-5 h-5' /> Done
				</button>
			</div>

			{/* Color & brush picker */}
			<div className='flex items-center justify-center gap-3 px-4 py-2'>
				<div className='flex items-center gap-1.5'>
					{COLORS.map((c) => (
						<button
							key={c}
							onClick={() => setColor(c)}
							className={`w-6 h-6 rounded-full border-2 transition-transform ${
								color === c ? "border-white scale-110" : "border-transparent"
							}`}
							style={{ backgroundColor: c }}
						/>
					))}
				</div>
				{tool === "draw" && (
					<div className='flex items-center gap-1 ml-3'>
						{BRUSH_SIZES.map((s) => (
							<button
								key={s}
								onClick={() => setBrushSize(s)}
								className={`flex items-center justify-center w-7 h-7 rounded-full ${
									brushSize === s ? "bg-white/20" : "hover:bg-white/10"
								}`}
							>
								<span
									className='rounded-full bg-white'
									style={{ width: s + 2, height: s + 2 }}
								/>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Text input popup */}
			{tool === "text" && textPos && (
				<div className='flex items-center justify-center gap-2 px-4 py-2'>
					<input
						type='text'
						value={textInput}
						onChange={(e) => setTextInput(e.target.value)}
						placeholder='Type text...'
						autoFocus
						className='px-3 py-2 rounded-lg bg-white/10 text-white placeholder-slate-500 text-sm focus:outline-none border border-white/20'
						onKeyDown={(e) => e.key === "Enter" && handleAddText()}
					/>
					<button
						onClick={handleAddText}
						className='px-3 py-2 bg-primary text-white rounded-lg text-sm'
					>
						Add
					</button>
				</div>
			)}

			{/* Canvas */}
			<div className='flex-1 flex items-center justify-center px-4'>
				{imageLoaded && (
					<canvas
						ref={canvasRef}
						className='cursor-crosshair rounded-lg'
						onMouseDown={handlePointerDown}
						onMouseMove={handlePointerMove}
						onMouseUp={handlePointerUp}
						onMouseLeave={handlePointerUp}
						onTouchStart={handlePointerDown}
						onTouchMove={handlePointerMove}
						onTouchEnd={handlePointerUp}
					/>
				)}
				{!imageLoaded && (
					<span className='loading loading-spinner loading-lg text-primary'></span>
				)}
			</div>

			{tool === "text" && !textPos && (
				<p className='text-center text-sm text-slate-400 py-2'>
					Tap on the image to place text
				</p>
			)}
		</div>
	);
};

export default ImageEditor;
