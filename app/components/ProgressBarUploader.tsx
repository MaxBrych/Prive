"use client";

import { useRef, useState } from "react";

import Button from "./Button";
import Spinner from "./Spinner";
import fileReaderStream from "filereader-stream";
import getBundlr from "../utils/getBundlr";

interface ProgressBarUploaderProps {
	showPreview?: boolean;
}

export const ProgressBarUploader: React.FC<ProgressBarUploaderProps> = ({ showPreview = true }) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const [fileType, setFileType] = useState<string>("");
	const [fileUrl, setFileUrl] = useState<string>("");
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

		// Get a create a streamed reader
		const dataStream = fileReaderStream(selectedFile);
		// save a reference to the file size

		// Divide the total file size by the size of each chunk we'll upload
		if (selectedFile?.size < chunkSize) totalChunks.current = 1;
		else {
			totalChunks.current = Math.floor((selectedFile?.size || 0) / chunkSize);
		}

		/** Register Event Callbacks */
		// Event callback chunkUpload: called for every chunk uploaded
		uploader.on("chunkUpload", (chunkInfo) => {
			console.log(chunkInfo);
			console.log(
				`Uploaded Chunk number ${chunkInfo.id}, offset of ${chunkInfo.offset}, size ${chunkInfo.size} Bytes, with a total of ${chunkInfo.totalUploaded} bytes uploaded.`,
			);

			const chunkNumber = chunkInfo.id + 1;
			// update the progress bar based on how much has been uploaded
			if (chunkNumber >= totalChunks.current) setProgress(100);
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
				setFileUrl(`https://arweave.net/${res.data.id}`);
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

	return (
		<div className="w-[500px] bg-white rounded-lg shadow-2xl p-5 border">
			<div className="space-y-6">
				<div
					className={`border-2 border-dashed bg-[#EEF0F6]/60 border-[#EEF0F6] rounded-lg p-4 text-center z-50`}
					onDragOver={(event) => event.preventDefault()}
					onDrop={(event) => {
						event.preventDefault();
						const droppedFiles = Array.from(event.dataTransfer.files);
						setSelectedFile(droppedFiles[0]);
					}}
				>
					<p className="text-gray-400 mb-2">Drag and drop files here</p>
					<input type="file" onChange={handleFileUpload} className="hidden" />
					<button
						onClick={() => {
							const input = document.querySelector('input[type="file"]') as HTMLInputElement;
							if (input) {
								input.click();
							}
						}}
						className={`w-full min-w-full py-2 px-4 bg-[#DBDEE9] text-text font-bold rounded-md flex items-center justify-center transition-colors duration-500 ease-in-out`}
					>
						Browse Files
					</button>
				</div>
				{showPreview && selectedFile && (
					<div className="w-full bg-primary h-[250px] rounded-xl">
						<div>
							<img
								className="w-full h-[250px] rounded-xl resize-none bg-primary object-cover"
								src={URL.createObjectURL(selectedFile)}
								alt="Selected"
							/>
						</div>
					</div>
				)}

				{selectedFile && (
					<>
						<div key="1" className="flex items-center mb-2 text-background-contrast">
							<span className="mr-2">{selectedFile.name}</span>
						</div>
						<div className="mt-2 h-6 bg-primary rounded-full" id="progress_bar_container">
							<div
								className="h-6 bg-background-contrast rounded-full"
								style={{ width: `${progress}%` }}
								id="progress_bar"
							></div>
						</div>
						{message && <div className="text-red-500" dangerouslySetInnerHTML={{ __html: message }} />}{" "}
						<Button onClick={handleUpload} disabled={txProcessing}>
							{txProcessing ? <Spinner color="text-background" /> : "Upload"}
						</Button>
					</>
				)}
			</div>
		</div>
	);
};

export default ProgressBarUploader;

/* 
USAGE:
- Default (shows the preview): 
  <ProgressBarUploader />

- To hide the preview:
  <ProgressBarUploader showPreview={false} />

Note:
* If `showPreview` is not provided, the component defaults to showing the preview.
*/
