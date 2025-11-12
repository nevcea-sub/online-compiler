import { useApp } from '../context/AppContext';
import { CONFIG } from '../config/constants';

const OutputPanel = ({ input, setInput, output, error }) => {
    const { t, setOutput, executionTime, isRunning } = useApp();

    const handleClear = () => {
        setOutput('');
    };

    const outputText = typeof output === 'object' && output.text ? output.text : output;
    const images = typeof output === 'object' && output.images ? output.images : [];
    const hasContent = outputText || error || images.length > 0;

    return (
        <div className="flex flex-col bg-bg-secondary/80 backdrop-blur-sm border border-border-color rounded-xl overflow-hidden min-h-[400px] h-full shadow-lg transition-all duration-300 relative hover:shadow-xl hover:border-accent-primary/30 hover:-translate-y-0.5 group md:min-h-[300px]" style={{ gridArea: 'output' }}>
            <div className="bg-gradient-to-r from-bg-tertiary to-bg-tertiary/50 px-6 py-4 border-b border-border-color/50 flex justify-between items-center min-h-[52px] md:px-4 md:min-h-[48px] md:flex-wrap md:gap-2">
                <div className="flex items-center gap-3 flex-1">
                    <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-warning animate-pulse' : error ? 'bg-error' : 'bg-success'}`}></div>
                    <span className="font-bold text-text-primary text-sm uppercase tracking-widest">
                        {t('execution-result')}
                    </span>
                    {executionTime !== null && !isRunning && (
                        <span className="text-xs text-text-muted font-normal normal-case tracking-normal">
                            ({executionTime}ms)
                        </span>
                    )}
                </div>
                {hasContent && (
                    <button 
                        className="flex items-center gap-2 bg-bg-tertiary/50 text-text-secondary border border-border-color/50 px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-300 hover:bg-error/10 hover:text-error hover:border-error/30 active:scale-95 focus-visible:outline-2 focus-visible:outline-error focus-visible:outline-offset-2 md:text-[0.8rem] md:px-3 md:py-1.5" 
                        onClick={handleClear} 
                        title={t('clear-output')}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>{t('clear-output')}</span>
                    </button>
                )}
            </div>
            <div id="output" className="flex-1 flex flex-col min-h-[120px]">
                <div className="flex-1 p-5 font-mono text-sm leading-[1.7] whitespace-pre-wrap break-words overflow-y-auto text-text-primary min-h-[100px] max-h-[500px] bg-bg-primary relative md:p-4 md:text-[13px] md:max-h-[400px]">
                    {isRunning ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin"></div>
                            </div>
                            <p className="text-text-muted text-sm">{t('executing') || 'Executing code...'}</p>
                        </div>
                    ) : !hasContent ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <svg className="w-16 h-16 text-text-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="m-0 p-0 text-text-muted font-mono text-sm leading-[1.7] text-center md:text-[13px]">{t('output-placeholder')}</p>
                        </div>
                    ) : (
                        <>
                            {images.map((img, index) => (
                                <div key={index} className="my-2 break-words py-0.5">
                                    <img
                                        src={img.data}
                                        alt={img.name}
                                        className="block max-w-full h-auto mt-2 rounded"
                                    />
                                </div>
                            ))}
                            {outputText && (
                                <pre className="whitespace-pre-line m-0 p-0 bg-transparent border-none font-inherit text-inherit leading-inherit">
                                    {outputText}
                                </pre>
                            )}
                            {error && (
                                <pre className="m-0 p-0 bg-transparent border-none font-inherit text-error whitespace-pre-wrap break-words">
                                    {error}
                                </pre>
                            )}
                            {!outputText && !error && images.length === 0 && (
                                <p className="m-0 p-0 text-text-muted font-mono text-sm leading-[1.7] relative top-0 left-0 w-auto h-auto md:text-[13px]">{t('no-output')}</p>
                            )}
                        </>
                    )}
                </div>
                <div className="flex items-center px-4 py-3 bg-bg-tertiary border-t border-border-color gap-2 focus-within:bg-bg-secondary md:px-4 md:py-3.5 md:gap-2">
                    <span className="text-accent-primary font-semibold font-mono text-sm flex-shrink-0 select-none md:text-[13px]">&gt;</span>
                    <input
                        type="text"
                        className="flex-1 bg-transparent border-none text-text-primary font-mono text-sm py-1 outline-none transition-opacity duration-200 placeholder:text-text-muted placeholder:opacity-80 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 focus-visible:rounded disabled:opacity-60 disabled:cursor-not-allowed md:text-[13px]"
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

