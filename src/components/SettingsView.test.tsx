import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SettingsView } from './SettingsView';
import { initialState } from '../domain/state';
import { createEncryptedBackup, saveTextFile } from '../data/backup';
vi.mock('../data/backup',()=>({createEncryptedBackup:vi.fn(),saveTextFile:vi.fn(),readEncryptedBackup:vi.fn()}));
afterEach(()=>{vi.clearAllMocks();vi.restoreAllMocks();});
const props=()=>({state:initialState(),setState:vi.fn().mockResolvedValue(true),patchSettings:vi.fn().mockResolvedValue(true),setLanguage:vi.fn(),setTheme:vi.fn(),updatePreset:vi.fn(),addPreset:vi.fn(),removePreset:vi.fn(),onReset:vi.fn().mockResolvedValue(undefined)});
it('does not offer nonfunctional reminder or cloud sync actions',()=>{
  Object.defineProperty(window,'matchMedia',{configurable:true,value:vi.fn(()=>({matches:false}))});
  render(<SettingsView {...props()}/>);
  expect(screen.queryByRole('button',{name:'Enable web reminders'})).not.toBeInTheDocument();
  expect(screen.queryByText('Optional encrypted sync')).not.toBeInTheDocument();
  expect(screen.getByText(/Reminders are not available/)).toBeInTheDocument();
});
it('offers usage analytics, off, with a way to turn it on',async()=>{
  Object.defineProperty(window,'matchMedia',{configurable:true,value:vi.fn(()=>({matches:false}))});
  const p=props();render(<SettingsView {...p}/>);
  const toggle=screen.getByRole('checkbox',{name:'Share usage analytics'});
  expect(toggle).not.toBeChecked();
  fireEvent.click(toggle);
  await waitFor(()=>expect(p.patchSettings).toHaveBeenCalledWith({analyticsOptIn:true}));
});
// Turning the toggle on while the browser sends Do Not Track reports nothing, so the card
// says so rather than leaving a dashboard that never moves unexplained.
it('says when a browser privacy signal is overriding the toggle',()=>{
  Object.defineProperty(window,'matchMedia',{configurable:true,value:vi.fn(()=>({matches:false}))});
  Object.defineProperty(navigator,'doNotTrack',{configurable:true,value:'1'});
  const p=props();p.state.settings.analyticsOptIn=true;
  render(<SettingsView {...p}/>);
  expect(screen.getByText(/asks sites not to track/)).toBeInTheDocument();
  Object.defineProperty(navigator,'doNotTrack',{configurable:true,value:undefined});
});
it('does not display backup saved when sharing is cancelled',async()=>{
  Object.defineProperty(window,'matchMedia',{configurable:true,value:vi.fn(()=>({matches:false}))});
  vi.mocked(createEncryptedBackup).mockResolvedValue('{}');vi.mocked(saveTextFile).mockResolvedValue(false);
  render(<SettingsView {...props()}/>);
  fireEvent.click(screen.getByRole('button',{name:'Export encrypted backup'}));
  await waitFor(()=>expect(saveTextFile).toHaveBeenCalled());
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
});
it('clamps target values before passing them to state',()=>{
  Object.defineProperty(window,'matchMedia',{configurable:true,value:vi.fn(()=>({matches:false}))});
  const p=props();render(<SettingsView {...p}/>);
  fireEvent.change(screen.getByLabelText(/Tasbih/),{target:{value:'100000'}});
  expect(p.updatePreset).toHaveBeenCalledWith('tasbih',{target:9999});
});

it('prepares an iOS backup before requesting the share sheet on a fresh tap',async()=>{
  vi.spyOn(navigator,'userAgent','get').mockReturnValue('iPhone');
  Object.defineProperty(window,'matchMedia',{configurable:true,value:vi.fn(()=>({matches:true}))});
  vi.mocked(createEncryptedBackup).mockResolvedValue('{}'); vi.mocked(saveTextFile).mockResolvedValue(false);
  render(<SettingsView {...props()}/>);
  fireEvent.click(screen.getByRole('button',{name:'Export encrypted backup'}));
  const save=await screen.findByRole('button',{name:'Save backup'});
  expect(saveTextFile).not.toHaveBeenCalled();
  fireEvent.click(save);
  await waitFor(()=>expect(saveTextFile).toHaveBeenCalledOnce());
  expect(screen.getByRole('button',{name:'Save backup'})).toBeInTheDocument();
});
