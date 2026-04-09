'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const nodes = [
  { id: 'arroz-feijao', label: 'Arroz com feijão', category: 'base', calories: 320 },
  { id: 'frango-grelhado', label: 'Frango grelhado', category: 'proteina', calories: 165 },
  { id: 'batata-doce', label: 'Batata doce', category: 'carboidrato', calories: 90 },
  { id: 'brocolis', label: 'Brócolis', category: 'vegetal', calories: 34 },
  { id: 'acai', label: 'Açaí', category: 'base', calories: 247 },
  { id: 'tapioca', label: 'Tapioca', category: 'carboidrato', calories: 170 },
  { id: 'pao-de-queijo', label: 'Pão de queijo', category: 'lanche', calories: 260 },
  { id: 'coxinha', label: 'Coxinha', category: 'lanche', calories: 310 },
  { id: 'vitamina-banana', label: 'Vitamina de banana', category: 'bebida', calories: 150 },
  { id: 'ovo-mexido', label: 'Ovo mexido', category: 'proteina', calories: 148 },
  { id: 'macarrao', label: 'Macarrão', category: 'carboidrato', calories: 220 },
  { id: 'salada-mista', label: 'Salada mista', category: 'vegetal', calories: 45 },
  { id: 'cafe-leite', label: 'Café com leite', category: 'bebida', calories: 60 },
  { id: 'bife', label: 'Bife', category: 'proteina', calories: 250 },
  { id: 'moqueca', label: 'Moqueca', category: 'base', calories: 380 },
]

const links = [
  { source: 'arroz-feijao', target: 'bife' },
  { source: 'arroz-feijao', target: 'frango-grelhado' },
  { source: 'arroz-feijao', target: 'salada-mista' },
  { source: 'frango-grelhado', target: 'batata-doce' },
  { source: 'frango-grelhado', target: 'brocolis' },
  { source: 'acai', target: 'vitamina-banana' },
  { source: 'tapioca', target: 'cafe-leite' },
  { source: 'pao-de-queijo', target: 'cafe-leite' },
  { source: 'ovo-mexido', target: 'cafe-leite' },
  { source: 'macarrao', target: 'bife' },
  { source: 'moqueca', target: 'arroz-feijao' },
  { source: 'coxinha', target: 'vitamina-banana' },
  { source: 'batata-doce', target: 'brocolis' },
  { source: 'salada-mista', target: 'frango-grelhado' },
]

const categoryColors: Record<string, string> = {
  base: '#22c55e',
  proteina: '#3b82f6',
  carboidrato: '#f59e0b',
  vegetal: '#10b981',
  bebida: '#8b5cf6',
  lanche: '#ef4444',
}

export default function GrafoD3() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    const width = svgRef.current?.clientWidth || 600
    const height = svgRef.current?.clientHeight || 400

    svg.selectAll('*').remove()

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(40))

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#374151')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag<any, any>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x; d.fy = d.y
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null; d.fy = null
          })
      )

    node.append('circle')
      .attr('r', (d: any) => Math.sqrt(d.calories) * 0.9 + 8)
      .attr('fill', (d: any) => categoryColors[d.category] || '#6b7280')
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)

    node.append('text')
      .text((d: any) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .attr('font-weight', '600')
      .style('pointer-events', 'none')

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .style('position', 'fixed')
      .style('background', '#1f2937')
      .style('border', '1px solid #374151')
      .style('padding', '8px 12px')
      .style('border-radius', '8px')
      .style('font-size', '12px')
      .style('color', 'white')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('z-index', '50')
      .style('transition', 'opacity 0.15s')

    node
      .on('mouseover', (event: MouseEvent, d: any) => {
        tooltip
          .style('opacity', '1')
          .html(`<strong>${d.label}</strong><br/>${d.calories} kcal · ${d.category}`)
          .style('left', event.clientX + 12 + 'px')
          .style('top', event.clientY - 10 + 'px')
      })
      .on('mousemove', (event: MouseEvent) => {
        tooltip
          .style('left', event.clientX + 12 + 'px')
          .style('top', event.clientY - 10 + 'px')
      })
      .on('mouseout', () => tooltip.style('opacity', '0'))

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
      tooltip.remove()
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      aria-hidden="true"
    />
  )
}
