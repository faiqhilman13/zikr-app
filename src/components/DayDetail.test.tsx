import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { BreakdownRows } from './DayDetail';
it('retains deleted phrase details and gives old orphan counts a visible fallback',()=>{
  render(<BreakdownRows log={{date:'2026-01-01',counts:{archived:7,legacy:3},timedSeconds:{},completed:false}} presets={[{id:'archived',title:'My phrase',arabic:'ذكر',transliteration:'',target:0,custom:true}]}/>);
  expect(screen.getByText('My phrase')).toBeInTheDocument();
  expect(screen.getByText('7')).toBeInTheDocument();
  expect(screen.getByText('Archived phrase')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
});
