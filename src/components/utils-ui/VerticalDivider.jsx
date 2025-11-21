import { Divider, Flex } from "antd";

export function VerticalDivider({ width = 10 }) {
    return (
        <Flex vertical>
            <Divider
                type="vertical"
                style={{ flexGrow: 1, margin: `10px ${width}px` }}
            />
        </Flex>
    );
}