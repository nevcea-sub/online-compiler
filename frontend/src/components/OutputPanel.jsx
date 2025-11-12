import { useApp } from '../context/AppContext';
import { CONFIG } from '../config/constants';

const OutputPanel = ({ input, setInput, output, error }) => {
    const { t, setOutput } = useApp();

    const handleClear = () => {
        setOutput('');
    };

    const outputText = typeof output === 'object' && output.text ? output.text : output;
    const images = typeof output === 'object' && output.images ? output.images : [];
    const hasContent = outputText || error || images.length > 0;

    return (
        <div className="output-section">
            <div className="output-header">
                <span className="output-title">{t('execution-result')}</span>
                {hasContent && (
                    <button className="clear-output-btn" onClick={handleClear} title={t('clear-output')}>
                        <span>{t('clear-output')}</span>
                    </button>
                )}
            </div>
            <div id="output" className="output-content">
                <div className="console-output">
                    {!hasContent ? (
                        <p className="text-muted">{t('output-placeholder')}</p>
                    ) : (
                        <>
                            {images.map((img, index) => (
                                <div key={index} className="console-line console-image">
                                    <img
                                        src={img.data}
                                        alt={img.name}
                                        style={CONFIG.IMAGE_STYLES}
                                    />
                                </div>
                            ))}
                            {outputText && (
                                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {outputText}
                                </pre>
                            )}
                            {error && (
                                <pre
                                    style={{
                                        color: CONFIG.DEFAULT_ERROR_COLOR,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {error}
                                </pre>
                            )}
                            {!outputText && !error && images.length === 0 && (
                                <p className="text-muted">{t('no-output')}</p>
                            )}
                        </>
                    )}
                </div>
                <div className="console-input-wrapper">
                    <span className="console-prompt">&gt;</span>
                    <input
                        type="text"
                        className="console-input"
                        placeholder={t('console-input-placeholder')}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        autoComplete="off"
                    />
                </div>
            </div>
        </div>
    );
};

export default OutputPanel;

