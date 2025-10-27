import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBar from '../../src/components/SearchBar.vue'

describe('SearchBar.vue', () => {
  it('renders properly', () => {
    const wrapper = mount(SearchBar, {
      props: {
        modelValue: '',
        searching: false
      }
    })
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('emits update:modelValue when input changes', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        modelValue: '',
        searching: false
      }
    })

    const input = wrapper.find('input')
    await input.setValue('test search')
    
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['test search'])
  })

  it('emits search event when form is submitted', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        modelValue: 'test search',
        searching: false
      }
    })

    await wrapper.find('form').trigger('submit.prevent')
    
    expect(wrapper.emitted('search')).toHaveLength(1)
  })

  it('shows clear button when there is input', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        modelValue: 'test search',
        searching: false
      }
    })

    expect(wrapper.find('.clear-btn').exists()).toBe(true)
  })

  it('emits clear event when clear button is clicked', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        modelValue: 'test search',
        searching: false
      }
    })

    await wrapper.find('.clear-btn').trigger('click')
    
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('disables search button when searching', () => {
    const wrapper = mount(SearchBar, {
      props: {
        modelValue: 'test search',
        searching: true
      }
    })

    const searchButton = wrapper.find('button[type="submit"]')
    expect(searchButton.attributes('disabled')).toBeDefined()
  })
})