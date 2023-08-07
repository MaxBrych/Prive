"use client";

import { useState, useEffect, useRef } from "react";
import Switch from "react-switch";
import getBundlr from "../utils/getBundlr";
import Spinner from "./Spinner";
import fileReaderStream from "filereader-stream";

export const ProgressBarUploader: React.FC = () => {
	const [files, setFiles] = useState<File[]>([]);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [fileType, setFileType] = useState<string>("");

	const [progress, setProgress] = useState<number>(0);
	const [curBalance, setCurBalance] = useState<number>(0);
	const [txProcessing, setTxProcessing] = useState<boolean>(false);
	const [message, setMessage] = useState<string>("");

	const totalChunks = useRef<number>(0);

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			setSelectedFile(event.target.files[0]);
			setFileType(event.target.files[0].type);
		}
	};

	const handleUpload = async () => {
		setMessage("");
		// handle your file upload logic here
		if (!selectedFile) {
			setMessage("Please select a file first");
			return;
		}
		setTxProcessing(true);
		// Reset the progress bar
		setProgress(0);

		// Get a reference to our Bundlr singleton
		const bundlr = await getBundlr();

		const uploader = bundlr.uploader.chunkedUploader;
		// Change the batch size to 1 to make testing easier (default is 5)
		uploader.setBatchSize(1);
		// Change the chunk size to something small to make testing easier (default is 25MB)
		const chunkSize = 2000000;
		uploader.setChunkSize(chunkSize);

		// get a create a streamed reader
		const dataStream = fileReaderStream(selectedFile);
		// save a reference to the file size
		// setFileSize(dataStream.size);
		// divide the total file size by the size of each chunk we'll upload
		if (dataStream.size < chunkSize) totalChunks.current = 1;
		else {
			totalChunks.current = Math.floor(dataStream.size / chunkSize);
		}

		/** Register Event Callbacks */
		// Event callback: called for every chunk uploaded
		uploader.on("chunkUpload", (chunkInfo) => {
			console.log(chunkInfo);
			console.log(
				`Uploaded Chunk number ${chunkInfo.id}, offset of ${chunkInfo.offset}, size ${chunkInfo.size} Bytes, with a total of ${chunkInfo.totalUploaded} bytes uploaded.`,
			);

			const chunkNumber = chunkInfo.id + 1;
			// update the progress bar based on how much has been uploaded
			if (chunkNumber >= totalChunks) setProgress(100);
			else setProgress((chunkNumber / totalChunks.current) * 100);
		});

		// Event callback: called if an error happens
		uploader.on("chunkError", (e) => {
			console.error(`Error uploading chunk number ${e.id} - ${e.res.statusText}`);
		});

		// Event callback: called when file is fully uploaded
		uploader.on("done", (finishRes) => {
			console.log(`Upload completed with ID ${finishRes.id}`);
			// Set the progress bar to 100
			setProgress(100);
		});

		// Upload the file
		await uploader
			.uploadData(dataStream, {
				tags: [{ name: "Content-Type", value: fileType }],
				upload: { getReceiptSignature: true },
			})
			.then((res) => {
				console.log(res);
				setMessage(
					`File <a class="underline" target="_blank" href="https://arweave.net/${res.data.id}">uploaded</a>`,
				);
			})
			.catch((e) => {
				setMessage("Upload error " + e.message);
				console.log("error on upload, ", e);
			});

		setTxProcessing(false);
	};

	const handleStrongProvenanceChange = (checked: boolean) => {
		setIsStrongProvenance(checked);
	};

	return (
		<div className="mt-20 w-[500px] bg-background rounded-lg shadow-2xl p-5">
			<h2 className="text-3xl text-center font-bold mb-4 text-text">Progress Bar Uploader</h2>
			<div className="w-full bg-primary h-[300px] rounded-xl">
				{selectedFile && (
					<div>
						<img
							className="w-full h-[300px] rounded-xl resize-none bg-primary object-cover"
							src={URL.createObjectURL(selectedFile)}
							alt="Selected"
						/>
					</div>
				)}
			</div>
			<div className="pr-4 mt-5">
				<div
					className="border-2 border-dashed border-background-contrast rounded-lg p-4 mb-4 text-center"
					onDragOver={(event) => event.preventDefault()}
					onDrop={(event) => {
						event.preventDefault();
						const droppedFiles = Array.from(event.dataTransfer.files);
						setFiles(droppedFiles);
					}}
				>
					<p className="text-background-contrast mb-2">Drag and drop files here</p>
					<input type="file" onChange={handleFileUpload} className="hidden" />
					<button
						onClick={() => {
							const input = document.querySelector('input[type="file"]');
							if (input) {
								input.click();
							}
						}}
						className="px-4 py-2 bg-background-contrast text-background rounded-md border-2 border-background-contrast hover:border-background hover:bg-primary hover:text-background-contrast transition-all duration-500 ease-in-out"
					>
						Browse Files
					</button>
				</div>
				{files.map((file, index) => (
					<div key={index} className="flex items-center mb-2 text-background-contrast">
						<span className="mr-2">{file.name}</span>
					</div>
				))}
				<div className="mt-2 h-6 bg-primary rounded-full" id="progress_bar_container">
					<div
						className="h-6 bg-background-contrast rounded-full"
						style={{ width: `${progress}%` }}
						id="progress_bar"
					></div>
				</div>
				{message && <div className="text-red-500" dangerouslySetInnerHTML={{ __html: message }} />}{" "}
				<button
					className={`mt-5 w-full py-2 px-4 bg-background text-text rounded-md flex items-center justify-center transition-colors duration-500 ease-in-out border-2 border-background-contrast ${
						txProcessing
							? "bg-background-contrast text-white cursor-not-allowed"
							: "hover:bg-background-contrast hover:text-white"
					}`}
					onClick={handleUpload}
					disabled={txProcessing}
				>
					{txProcessing ? <Spinner color="text-background" /> : "Upload"}
				</button>
			</div>
		</div>
	);
};

export default ProgressBarUploader;