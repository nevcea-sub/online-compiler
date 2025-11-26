import { useEffect, useRef, memo, useCallback } from 'react';
import AceEditor from 'react-ace';
import { useApp } from '../../context/useApp';
import { LANGUAGE_CONFIG } from '../../config/constants';
import './styles.css';

import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/mode-rust';
import 'ace-builds/src-noconflict/mode-php';
import 'ace-builds/src-noconflict/mode-r';
import 'ace-builds/src-noconflict/mode-ruby';
import 'ace-builds/src-noconflict/mode-csharp';
import 'ace-builds/src-noconflict/mode-kotlin';
import 'ace-builds/src-noconflict/mode-golang';
import 'ace-builds/src-noconflict/mode-typescript';
import 'ace-builds/src-noconflict/mode-swift';
import 'ace-builds/src-noconflict/mode-perl';
import 'ace-builds/src-noconflict/mode-haskell';
import 'ace-builds/src-noconflict/mode-sh';

import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';

interface CodeEditorProps {
    onRun?: () => void;
}

const CodeEditor = memo(({ onRun }: CodeEditorProps) => {
    const { code, setCode, currentLanguage, theme, fontFamily, fontSize, t } = useApp();
    const editorRef = useRef<AceEditor>(null);

    const getSystemTheme = (): 'dark' | 'light' => {
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const aceTheme = (theme === 'system' ? getSystemTheme() : theme) === 'dark' ? 'monokai' : 'github';
    const mode = LANGUAGE_CONFIG.modes[currentLanguage] || 'text';

    const handleRunCommand = useCallback(() => {
        if (code && code.trim() && onRun) {
            onRun();
        }
    }, [code, onRun]);

    useEffect(() => {
        if (editorRef.current && onRun) {
            const editor = editorRef.current.editor;
            editor.commands.addCommand({
                name: 'runCode',
                bindKey: { win: 'Ctrl-Enter', mac: 'Cmd-Enter' },
                exec: handleRunCommand
            });
            return () => {
                editor.commands.removeCommand('runCode');
            };
        }
    }, [handleRunCommand, onRun]);

    useEffect(() => {
        if (editorRef.current && (!code || !code.trim())) {
            const editor = editorRef.current.editor;
            const timeoutId = setTimeout(() => {
                if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    editor.focus();
                }
            }, 200);
            return () => clearTimeout(timeoutId);
        }
    }, [currentLanguage, code]);

    return (
        <div
            className="w-full h-full min-h-[350px] relative"
            style={{
                width: '100%',
                height: '100%',
                minHeight: '350px',
                position: 'relative',
                zIndex: 1,
                pointerEvents: 'auto'
            }}
        >
            {!code || !code.trim() ? (
                <div
                    className="absolute inset-0 flex items-center justify-center z-[1]"
                    style={{
                        color: 'var(--text-muted)',
                        fontSize: '14px',
                        fontFamily: fontFamily,
                        userSelect: 'none',
                        padding: '20px',
                        pointerEvents: 'none'
                    }}
                >
                    <div className="text-center px-4">
                        <p className="text-sm text-muted-foreground">{t('code-placeholder')}</p>
                    </div>
                </div>
            ) : null}
            <AceEditor
                ref={editorRef}
                mode={mode}
                theme={aceTheme}
                value={code}
                onChange={setCode}
                fontSize={fontSize}
                width="100%"
                height="100%"
                style={{
                    position: 'relative',
                    zIndex: 2,
                    minHeight: '350px',
                    width: '100%',
                    height: '100%',
                    fontFamily: fontFamily
                }}
                className="ace-editor-wrapper"
                aria-label={t('code-editor')}
                setOptions={{
                    showLineNumbers: true,
                    tabSize: 4,
                    useSoftTabs: true,
                    wrap: true,
                    fontFamily: fontFamily,
                    showPrintMargin: false,
                    displayIndentGuides: true,
                    showFoldWidgets: false,
                    highlightActiveLine: true,
                    showInvisibles: false,
                    behavioursEnabled: true,
                    wrapBehavioursEnabled: true,
                    autoScrollEditorIntoView: true,
                    animatedScroll: false,
                    vScrollBarAlwaysVisible: false,
                    hScrollBarAlwaysVisible: false,
                    highlightSelectedWord: true,
                    selectionStyle: 'text',
                    fadeFoldWidgets: true,
                    useWorker: false,
                    indentedSoftWrap: false,
                    foldStyle: 'markbegin',
                    readOnly: false
                }}
                editorProps={{
                    $blockScrolling: Infinity
                }}
                onFocus={() => {
                    if (editorRef.current) {
                        editorRef.current.editor.focus();
                    }
                }}
            />
        </div>
    );
});

CodeEditor.displayName = 'CodeEditor';

export default CodeEditor;
