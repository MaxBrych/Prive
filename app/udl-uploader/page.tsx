import React, { FC } from "react";
import UDLUploader from "../components/UDLUploader";

const Page: FC = () => {
	return (
		<div className="min-h-screen bg-gray-200 text-text flex justify-center items-center mt-10">
			<UDLUploader />
		</div>
	);
};

export default Page;