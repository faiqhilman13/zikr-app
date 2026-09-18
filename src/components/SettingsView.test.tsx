import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SettingsView } from './SettingsView';
import { initialState } from '../domain/state';
import { createEncryptedBackup, saveTextFile } from '../data/backup';
vi.mock('../data/backup',()=>({createEncryptedBackup:vi.fn(),saveTextFile:vi.fn(),readEncryptedBackup:vi.fn()}));
afterEach(()=>{vi.clearAllMocks();vi.restoreAllMocks();});
const props=()=>({state:initialState(),setState:vi.fn().mockResolvedValue(true),patchSettings:vi.fn().mockResolvedValue(true),setLanguage:vi.fn(),setTheme:vi.fn(),updatePreset:vi.fn(),addPreset:vi.fn(),removePreset:vi.fn(),onReset:vi.fn().mockResolvedValue(undefined)});
it('does not offer nonfunctional reminder, cloud sync or analytics actions',()=>{
  Object.defineProperty(window,'matchMedia',{configurable:true,value:vi.fn(()=>({matches:false}))});
  render(<SettingsView {...props()}/>);
  expect(screen.queryByRole('button',{name:'Enable web reminders'})).not.toBeInTheDocument();
  expect(screen.queryByText('Optional encrypted sync')).not.toBeInTheDocument();
  expect(screen.queryByRole('checkbox',{name:'Share anonymous product events'})).not.toBeInTheDocument();
  expect(screen.getByText(/Reminders are not available/)).toBeInTheDocument();
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
