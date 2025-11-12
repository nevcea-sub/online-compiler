import { useEffect, useRef } from 'react';
import AceEditor from 'react-ace';
import { useApp } from '../context/AppContext';
import { LANGUAGE_CONFIG } from '../config/constants';

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

const CodeEditor = ({ onRun }) => {
    const { code, setCode, currentLanguage, theme, fontFamily, fontSize } = useApp();
    const editorRef = useRef(null);

    const getSystemTheme = () => {
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const aceTheme = (theme === 'system' ? getSystemTheme() : theme) === 'dark' ? 'monokai' : 'github';
    const mode = LANGUAGE_CONFIG.modes[currentLanguage] || 'text';

    useEffect(() => {
        if (editorRef.current && onRun) {
            const editor = editorRef.current.editor;
            editor.commands.addCommand({
                name: 'runCode',
                bindKey: { win: 'Ctrl-Enter', mac: 'Cmd-Enter' },
                exec: () => {
                    if (code && code.trim()) {
                        onRun();
                    }
                }
            });
        }
    }, [code, onRun]);

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '350px' }}>
            <AceEditor
                ref={editorRef}
                mode={mode}
                theme={aceTheme}
                value={code}
                onChange={setCode}
                fontSize={fontSize}
                fontFamily={fontFamily}
                showPrintMargin={false}
                displayIndentGuides={true}
                showFoldWidgets={false}
                highlightActiveLine={true}
                showInvisibles={false}
                behavioursEnabled={true}
                wrapBehavioursEnabled={true}
                autoScrollEditorIntoView={true}
                animatedScroll={false}
                vScrollBarAlwaysVisible={false}
                hScrollBarAlwaysVisible={false}
                highlightSelectedWord={true}
                selectionStyle="text"
                fadeFoldWidgets={true}
                useWorker={false}
                showLineNumbers={true}
                tabSize={4}
                useSoftTabs={true}
                wrap={true}
                indentedSoftWrap={false}
                foldStyle="markbegin"
                readOnly={false}
                width="100%"
                height="100%"
                setOptions={{
                    enableBasicAutocompletion: false,
                    enableLiveAutocompletion: false,
                    enableSnippets: false
                }}
            />
        </div>
    );
};

export default CodeEditor;

