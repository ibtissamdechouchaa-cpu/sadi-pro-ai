import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import '@cyntler/react-doc-viewer/dist/index.css';

interface Props {
  uri: string;
  fileType: string;
  fileName: string;
  height?: number;
}

export default function OfficeViewer({ uri, fileType, fileName, height = 650 }: Props) {
  return (
    <div className="rounded-lg border overflow-hidden" style={{ height }}>
      <DocViewer
        documents={[{ uri, fileType, fileName }]}
        pluginRenderers={DocViewerRenderers}
        config={{
          header: { disableHeader: false, disableFileName: false, retainURLParams: false },
          csvDelimiter: ',',
          pdfZoom: { defaultZoom: 1, zoomJump: 0.2 },
        }}
        style={{ height }}
      />
    </div>
  );
}
